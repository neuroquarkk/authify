import * as nodemailer from 'nodemailer';

async function createTestAccount() {
    const account = await nodemailer.createTestAccount();
    console.log('Ethereal Account Credentials:');
    console.log(account);
}

createTestAccount();
