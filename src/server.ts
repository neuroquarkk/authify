import { config } from '@config';
import app from './app';
import { checkConn } from '@db';

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
