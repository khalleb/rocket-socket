import { injectable } from "tsyringe";
import { User } from "../schemas/User";

@injectable()
class GetAllUserServices {
  async execute() {
    const users = await User.find();
    return users;
  }
}

export { GetAllUserServices };