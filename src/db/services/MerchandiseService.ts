import { query, queryOne, execute, withTransaction, buildSetClause } from '../query';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IMerchandiseOrder, IMerchandiseProduct, MerchandiseProductStatus, OrderStatus } from '../../interfaces/IMerchandise';

// Products
export async function listMerchandiseProducts(
    tenantId: string,
    activeOnly = false,
    search?: string,
    pagination?: { page?: number; limit?: number }
) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = pagination?.limit ? Math.min(10000, Math.max(1, pagination.limit)) : 10000;
    const offset = (page - 1) * limit;

    let baseWhere = `WHERE tenantId = ?`;
    const params: any[] = [tenantId];

    if (activeOnly) {
        baseWhere += ` AND status = 'active'`;
    }

    if (search) {
        baseWhere += ` AND (name LIKE ? OR sku LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    const countRow = await queryOne<RowDataPacket & { total: string }>(
        `SELECT COUNT(*) as total FROM merchandise_products ${baseWhere}`,
        params
    );
    const total = parseInt(countRow?.total ?? '0', 10);

    const sql = `
        SELECT * FROM merchandise_products 
        ${baseWhere} 
        ORDER BY createdAt DESC 
        LIMIT ? OFFSET ?
    `;

    const products = await query<RowDataPacket & IMerchandiseProduct>(sql, [...params, limit, offset]);

    return {
        products,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function getMerchandiseProduct(id: string, tenantId: string): Promise<IMerchandiseProduct | null> {
    return await queryOne<RowDataPacket & IMerchandiseProduct>('SELECT * FROM merchandise_products WHERE id = ? AND tenantId = ?', [id, tenantId]);
}

export async function createMerchandiseProduct(tenantId: string, data: Partial<IMerchandiseProduct>): Promise<IMerchandiseProduct> {
    const id = uuidv4();
    await execute(
        `INSERT INTO merchandise_products (id, tenantId, vendorId, sku, name, description, price, currency, imageUrl, stockQuantity, minimumTermMonths, maximumTermMonths, allowAutoOrdering, reorderLevel, status, category, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id, tenantId, data.vendorId || null, data.sku || `SKU-${Date.now()}`, data.name, data.description || null,
            data.price || 0, data.currency || 'BWP', data.imageUrl || null, data.stockQuantity || 0,
            data.minimumTermMonths || 1, data.maximumTermMonths || 12, data.allowAutoOrdering ? 1 : 0,
            data.reorderLevel || 0, data.status || MerchandiseProductStatus.ACTIVE, data.category || null
        ]
    );
    const product = await getMerchandiseProduct(id, tenantId);
    if (!product) throw new Error('Failed to create product');
    return product;
}

export async function updateMerchandiseProduct(id: string, tenantId: string, data: Partial<IMerchandiseProduct>): Promise<IMerchandiseProduct> {
    const { clause, values } = buildSetClause(data);
    if (!clause) throw new Error('No fields provided to update');

    await execute(`UPDATE merchandise_products SET ${clause}, updatedAt = NOW() WHERE id = ? AND tenantId = ?`, [...values, id, tenantId]);

    const product = await getMerchandiseProduct(id, tenantId);
    if (!product) throw new Error('Product not found');
    return product;
}

export async function deleteMerchandiseProduct(id: string, tenantId: string): Promise<boolean> {
    await execute('DELETE FROM merchandise_products WHERE id = ? AND tenantId = ?', [id, tenantId]);
    return true;
}

// Orders
export async function listMerchandiseOrders(
    tenantId: string,
    status?: OrderStatus,
    memberId?: string,
    pagination?: { page?: number; limit?: number }
) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = pagination?.limit ? Math.min(10000, Math.max(1, pagination.limit)) : 10000;
    const offset = (page - 1) * limit;

    let baseWhere = `WHERE o.tenantId = ?`;
    const params: any[] = [tenantId];

    if (status) {
        baseWhere += ' AND o.status = ?';
        params.push(status);
    }
    if (memberId) {
        baseWhere += ' AND o.memberId = ?';
        params.push(memberId);
    }

    const countRow = await queryOne<RowDataPacket & { total: string }>(
        `SELECT COUNT(*) as total 
         FROM merchandise_orders o
         LEFT JOIN members m ON m.id = o.memberId
         LEFT JOIN merchandise_products p ON p.id = o.productId
         ${baseWhere}`,
        params
    );
    const total = parseInt(countRow?.total ?? '0', 10);

    const sql = `
        SELECT o.*, 
               m.firstName, m.lastName, m.memberNumber,
               p.name AS productName, p.sku
        FROM merchandise_orders o
        LEFT JOIN members m ON m.id = o.memberId
        LEFT JOIN merchandise_products p ON p.id = o.productId
        ${baseWhere}
        ORDER BY o.createdAt DESC
        LIMIT ? OFFSET ?
    `;

    const orders = await query<RowDataPacket & IMerchandiseOrder>(sql, [...params, limit, offset]);

    return {
        orders,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function getMerchandiseOrder(id: string, tenantId: string): Promise<IMerchandiseOrder | null> {
    return await queryOne<RowDataPacket & IMerchandiseOrder>(`
        SELECT o.*, 
               m.firstName, m.lastName, m.memberNumber, m.email, m.phone,
               p.name AS productName, p.sku, p.stockQuantity, p.allowAutoOrdering, p.reorderLevel, p.vendorId
        FROM merchandise_orders o
        LEFT JOIN members m ON m.id = o.memberId
        LEFT JOIN merchandise_products p ON p.id = o.productId
        WHERE o.id = ? AND o.tenantId = ?
    `, [id, tenantId]);
}

export async function createMerchandiseOrder(tenantId: string, memberId: string, productId: string, data: Partial<IMerchandiseOrder>): Promise<IMerchandiseOrder> {
    const product = await getMerchandiseProduct(productId, tenantId);
    if (!product) throw new Error('Product not found');

    if (product.stockQuantity < (data.quantity || 1)) {
        throw new Error('Insufficient stock for this product');
    }

    if (data.termMonths && (data.termMonths < product.minimumTermMonths || data.termMonths > product.maximumTermMonths)) {
        throw new Error('Selected term is outside allowed limits');
    }

    let orderNumber = data.orderNumber;
    if (!orderNumber) {
        const countRes = await queryOne('SELECT COUNT(*) as c FROM merchandise_orders WHERE tenantId = ?', [tenantId]) as any;
        const tenantPrefix = tenantId.substring(0, 4).toUpperCase();
        orderNumber = `ORD-${tenantPrefix}-${String((countRes?.c || 0) + 1).padStart(5, '0')}`;
    }

    const id = uuidv4();
    await execute(
        `INSERT INTO merchandise_orders (id, tenantId, memberId, productId, orderNumber, quantity, totalPrice, termMonths, monthlyInstallment, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id, tenantId, memberId, productId, orderNumber, data.quantity || 1, data.totalPrice || 0,
            data.termMonths || 1, data.monthlyInstallment || 0, data.status || OrderStatus.PENDING
        ]
    );

    const order = await getMerchandiseOrder(id, tenantId);
    if (!order) throw new Error('Failed to create order');
    return order;
}

export async function updateMerchandiseOrderStatus(id: string, tenantId: string, newStatus: OrderStatus, bodyArgs: any = {}): Promise<IMerchandiseOrder> {
    return await withTransaction(async (conn) => {
        const [[order]] = await conn.query('SELECT * FROM merchandise_orders WHERE id = ? AND tenantId = ? LIMIT 1', [id, tenantId]) as any;
        if (!order) throw new Error('Order not found');

        const [[product]] = await conn.query('SELECT * FROM merchandise_products WHERE id = ? LIMIT 1', [order.productId]) as any;
        const oldStatus = order.status;

        // Deduct Stock on DELIVERED
        if (newStatus === OrderStatus.DELIVERED && oldStatus !== OrderStatus.DELIVERED && product) {
            if (product.stockQuantity < order.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stockQuantity}`);
            }
            await conn.query('UPDATE merchandise_products SET stockQuantity = stockQuantity - ? WHERE id = ?', [order.quantity, product.id]);
        }

        // Restore Stock on CANCELLED
        if (newStatus === OrderStatus.CANCELLED && oldStatus === OrderStatus.DELIVERED && product) {
            await conn.query('UPDATE merchandise_products SET stockQuantity = stockQuantity + ? WHERE id = ?', [order.quantity, product.id]);
        }

        const { clause, values } = buildSetClause({ ...bodyArgs, status: newStatus });
        await conn.query(`UPDATE merchandise_orders SET ${clause}, updatedAt = NOW() WHERE id = ? AND tenantId = ?`, [...values, id, tenantId]);

        // Notifications would go here... (extracted out typically)

        const [[updatedOrder]] = await conn.query('SELECT * FROM merchandise_orders WHERE id = ? AND tenantId = ?', [id, tenantId]) as any;
        return updatedOrder;
    });
}
