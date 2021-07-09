import { container } from 'tsyringe';
import { io } from '../http';
import { CreateChatRoomService } from '../services/CreateChatRoomService';
import { CreateMessageService } from '../services/CreateMessageService';
import { CreateUserService } from '../services/CreateUserService';
import { GetAllUserServices } from '../services/GetAllUserServices';
import GetChatRoomByIDService from '../services/GetChatRoomByIDService';
import { GetChatRoomByUsersService } from '../services/GetChatRoomByUsersService';
import { GetMessageByChatRoomService } from '../services/GetMessageByChatRoomService';
import { GetUserBySocketIdService } from '../services/GetUserBySocketIdService';

io.on('connect', socket => {
  socket.on('start', async (data) => {
    const { email, avatar, name } = data
    const createUserService = container.resolve(CreateUserService);
    const user = await createUserService.execute({
      email,
      avatar,
      name,
      socket_id: socket.id,
    });
    socket.broadcast.emit('new_users', user);
  });

  socket.on('get_users', async (callback) => {
    const getAllUserServices = container.resolve(GetAllUserServices);
    const user = await getAllUserServices.execute();
    callback(user);
  });

  socket.on('start_chat', async (data, callback) => {
    const createChatRoomService = container.resolve(CreateChatRoomService);
    const getChatRoomByUsersService = container.resolve(GetChatRoomByUsersService);
    const getUserBySocketIdService = container.resolve(GetUserBySocketIdService);
    const getMessagesByChatRoom = container.resolve(GetMessageByChatRoomService);
    
    const userLogged = await getUserBySocketIdService.execute(socket.id);

    let room = await getChatRoomByUsersService.execute([data.idUser, userLogged._id]);
    if (!room) {
      room = await createChatRoomService.execute([data.idUser, userLogged._id]);
    }
    socket.join(room.idChatRoom);
    const messages = await getMessagesByChatRoom.execute(room.idChatRoom);
    callback({room , messages});
  });

  socket.on('message', async (data) => {
    const getUserBySocketIdService = container.resolve(GetUserBySocketIdService);
    const createMessageService = container.resolve(CreateMessageService);
    const getChatRoomById =  container.resolve(GetChatRoomByIDService);

    const user = await getUserBySocketIdService.execute(socket.id);
    const message = await createMessageService.execute({
      to: user._id,
      text: data.message,
      roomId: data.idChatRoom
    });
    io.to(data.idChatRoom).emit("message", {message, user});

    const room = await getChatRoomById.execute(data.idChatRoom);

    const userFrom = room.idUsers.find(response => response._id !== user._id);

    io.to(userFrom.socket_id).emit("notification", {
      newMessage: true,
      roomId: data.idChatRoom,
      from: user,
    })
  })
})


// mensagem global - todos usuários
// io.emit()

// mensagem por usuario
// socket.emit()