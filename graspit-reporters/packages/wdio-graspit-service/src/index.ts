import GraspItService from './service';
import type { GraspItServiceOptions } from './types';

export default { launcher: GraspItService };

declare global {
  namespace WebdriverIO {
    interface ServiceOption extends GraspItServiceOptions {}
  }
}
