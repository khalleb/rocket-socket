import { injectable } from "tsyringe";
import { ChatRoom } from "../schemas/ChatRoom";

@injectable()
export default class GetChatRoomByIDService{

  async execute(idChatRoom: string){
    const room = await ChatRoom.findOne({idChatRoom}).populate("idUsers").exec();
    return room;
  }
}