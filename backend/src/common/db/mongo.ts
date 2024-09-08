import { MongooseModule } from '@nestjs/mongoose';
import { getSecret } from '../secrets';
import SecretKeys from '../secrets/keys';

const MongodbConnection = MongooseModule.forRoot(
  getSecret(SecretKeys.MONGO_URI),
);

export default MongodbConnection;
