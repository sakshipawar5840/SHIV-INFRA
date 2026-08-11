import fs from 'fs';
const path = 'C:/Users/SP/Downloads/shiv-infra/backend/services/modules/BillService.ts';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `async updateBill(



    updateData:any

){



try{



const cleanData = {



    ...updateData,



    new Date()
    .toISOString()



};`;

const newBlock = `async updateBill(
    id:string,
    companyId:string,
    updateData:any
){



try{



    const cleanData = {



        ...updateData,



        updated_at:
        new Date()
        .toISOString()



    };`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(path, content);
console.log('Fixed updateBill method');
