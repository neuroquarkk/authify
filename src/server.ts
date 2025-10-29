import { config } from '@config';
import app from './app';
import { checkConn } from '@db';

// FIX for TypeError: BigInt value can't be serialized in JSON
BigInt.prototype.toJSON = function () {
    return this.toString();
};

async function main() {
    try {
        await checkConn();
        app.listen(config.PORT, () => {
            console.log(`server started on :${config.PORT}`);
        });
    } catch (error) {
        process.exit(1);
    }
}

main();
