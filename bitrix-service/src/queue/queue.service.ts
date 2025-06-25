import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import axios from 'axios';
import { sendReply } from '../rabbit/consumer';
import { connection } from './redis';

@Injectable()
export class QueueService implements OnModuleInit {
  async onModuleInit() {
    new Worker(
      'bitrixQueue',
      async job => {
        const { action, user, replyQueue } = job.data;

        const webhook = 'https://b24-qc4398.bitrix24.kz/rest/1/ytyiwmqfk1z0h0xx';
        let url = '';
        switch (action) {
          case 'create_card':
            url = `${webhook}/crm.lead.add`;
            break;
          case 'update_card':
            url = `${webhook}/crm.lead.update`;
            break;
          case 'move_card':
            url = `${webhook}/crm.lead.status`;
            break;
        }

        const payload: any = {
          fields: {
            TITLE: `Lead for ${user.full_name}`,
            NAME: user.full_name,
            PHONE: [{ VALUE: user.phone, VALUE_TYPE: 'WORK' }],
            STATUS_ID: user.stage,
          },
        };

        if (action !== 'create_card') {
          payload.id = user.bitrix_id;
        }

        try {
          const { data } = await axios.post(url, payload);
          await sendReply(replyQueue, {
            status: 'success',
            userId: user.id,
            bitrix_id: data.result,
            result: data,
          });
        } catch (error: any) {
          await sendReply(replyQueue, {
            status: 'error',
            userId: user.id,
            error: error.response?.data || error.message,
          });
        }
      },
      { connection }
    );
  }
}
