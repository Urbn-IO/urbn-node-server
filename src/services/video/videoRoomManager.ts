import { getConnection } from "typeorm";
import { CallRoom } from "../../entities/CallRoom";

export const storeRoomName = async (requestId: number, roomName: string) => {
  await getConnection().query(
    `
    INSERT INTO call_room ("requestId", "roomName")
    VALUES ($1, $2)
    ON CONFLICT ("requestId") DO UPDATE
    SET "roomName" = $2;
    `,
    [requestId, roomName]
  );
};

export const deleteRoom = async (requestId: number) => {
  await CallRoom.delete({ requestId });
};
