import 'reflect-metadata';
import { Entity, PrimaryColumn, ManyToOne, OneToMany, getMetadataArgsStorage } from 'typeorm';

@Entity('members_test')
export class MemberTest {
    @PrimaryColumn() id: string = '';
    @OneToMany('BeneficiaryTest', 'member')
    beneficiaries: any[] = [];
}

@Entity('beneficiaries_test')
export class BeneficiaryTest {
    @PrimaryColumn() id: string = '';
    @ManyToOne('MemberTest', 'beneficiaries')
    member: any;
}

const metadata = getMetadataArgsStorage();
console.log("Relations:");
metadata.relations.forEach((r: any) => {
    console.log({
        targetName: typeof r.target === 'function' ? r.target.name : r.target,
        propertyName: r.propertyName,
        type: typeof r.type === 'function' ? r.type() : r.type,
        inverseSide: typeof r.inverseSideProperty === 'function' ? r.inverseSideProperty() : r.inverseSideProperty
    });
});
