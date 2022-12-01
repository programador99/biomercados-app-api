import axios from 'axios';
import Notification from '../models/notifications';
import { registerLogError } from "../middlewares/registerLog";

const serverKey = process.env.API_KEY_GOOGLE_FCM;

export const sendNotificationForFCM = async (listTokens,notification,data) => {
    try{      
        let response = await axios.post('https://fcm.googleapis.com/fcm/send', {
             "registration_ids" : listTokens,
             "notification" : notification,
             "data":data
            }, {
             headers: {
             'Content-Type': 'application/json',
             'Authorization': 'key = ' + serverKey 
             }
           }
         )
    }catch(err){
        registerLogError('error en el envio de notificaciones ' + err);
    }
}

export const saveUserNotification = async (userId, deviceId, token) => {
  const userRegister = await Notification.findOne({ userId });
  if (!userRegister) {
    const notification = { userId, deviceId, token };
    return await Notification.create(notification);
  } else {    
    if (userRegister.token != token) {
      await Notification.updateOne({userId}, { $set: { token } })
    }
  }
}

export const asigneUserIdToUserNotificationForDeviceId = async (deviceId, userId) => {
  const userRegister = await Notification.findOne({ userId });
  if (userRegister) {
    await Notification.deleteOne({ userId })
  }
  return await Notification.updateOne({deviceId}, { $set: { userId } })
}


export const sendNotification = async (userIds, message, data) => {
  let listToken = [];

  for await (const userId of userIds) {
    const token = (await Notification.findOne({ userId }))?.token;
    if (token) {
      listToken.push(token);
    }
  }

  if (listToken.length > 0) {
    await sendNotificationForFCM(listToken, message, data);
  }
}
