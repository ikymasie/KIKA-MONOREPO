import 'dotenv/config';
import { AppDataSource } from '../src/config/database';
import { Tenant } from '../src/entities/Tenant';

async function testBrandingApi() {
    try {
        console.log('🚀 Starting Branding API Test...');

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('✅ Database initialized');
        }

        const tenantRepo = AppDataSource.getRepository(Tenant);

        // Find a test tenant
        const tenant = await tenantRepo.findOne({ where: {} });
        if (!tenant) {
            console.error('❌ No tenant found to test with.');
            return;
        }

        console.log(`📝 Testing with Tenant: ${tenant.name} (${tenant.id})`);

        // Simulate PATCH update
        const updatedBranding = {
            logoUrl: 'https://example.com/logo.png',
            primaryColor: '#ff0000',
            secondaryColor: '#00ff00',
            brandingSettings: {
                sidebarTheme: 'dark' as const,
            }
        };

        tenant.logoUrl = updatedBranding.logoUrl;
        tenant.primaryColor = updatedBranding.primaryColor;
        tenant.secondaryColor = updatedBranding.secondaryColor;
        tenant.brandingSettings = updatedBranding.brandingSettings;

        await tenantRepo.save(tenant);
        console.log('✅ Branding fields saved successfully');

        // Verify retrieval
        const savedTenant = await tenantRepo.findOne({ where: { id: tenant.id } });
        if (
            savedTenant?.logoUrl === updatedBranding.logoUrl &&
            savedTenant?.primaryColor === updatedBranding.primaryColor &&
            savedTenant?.secondaryColor === updatedBranding.secondaryColor &&
            JSON.stringify(savedTenant?.brandingSettings) === JSON.stringify(updatedBranding.brandingSettings)
        ) {
            console.log('✅ Branding retrieval verified successfully');
        } else {
            console.error('❌ Branding verification failed: Data mismatch');
            console.log('Expected:', updatedBranding);
            console.log('Actual:', {
                logoUrl: savedTenant?.logoUrl,
                primaryColor: savedTenant?.primaryColor,
                secondaryColor: savedTenant?.secondaryColor,
                brandingSettings: savedTenant?.brandingSettings
            });
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

testBrandingApi();
