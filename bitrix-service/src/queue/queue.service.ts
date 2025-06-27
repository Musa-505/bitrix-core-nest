// bitrix-service/src/queue/queue.service.ts
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

        if (!user.phone) {
          await sendReply(replyQueue, {
            status: 'error',
            action,
            userId: user.id,
            error: 'User phone is missing, cannot process Bitrix24 request.',
          });
          return;
        }

        const webhook = process.env.BITRIX_WEBHOOK_URL || 'https://b24-qc4398.bitrix24.kz/rest/1/ytyiwmqfk1z0h0xx';
        let url = '';
        let bitrixMethod = '';

        switch (action) {
          case 'create_card':
            bitrixMethod = 'crm.lead.add';
            url = `${webhook}/${bitrixMethod}`;
            break;
          case 'update_card':
            bitrixMethod = 'crm.lead.update';
            url = `${webhook}/${bitrixMethod}`;
            break;
          case 'move_card':
            bitrixMethod = 'crm.lead.update';
            url = `${webhook}/${bitrixMethod}`;
            break;
          default:
            await sendReply(replyQueue, {
              status: 'error',
              action,
              userId: user.id,
              error: `Unknown action type: ${action}`,
            });
            return;
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
          if (!user.bitrix_id) {
            await sendReply(replyQueue, {
              status: 'error',
              action,
              userId: user.id,
              error: `Missing Bitrix ID for action ${action}.`,
            });
            return;
          }
          payload.id = user.bitrix_id;
        }

        try {
          console.log(`[Bitrix-Service] Sending request to Bitrix24: ${url} with payload:`, payload);
          const { data } = await axios.post(url, payload);
          console.log(`[Bitrix-Service] Received response from Bitrix24:`, data);

          await sendReply(replyQueue, {
            status: 'success',
            action,
            userId: user.id,
            bitrix_id: data.result,
            result: data,
          });
        } catch (error: any) {
          console.error(`[Bitrix-Service] Error sending request to Bitrix24 for user ${user.id}, action ${action}:`, error.message);
          await sendReply(replyQueue, {
            status: 'error',
            action,
            userId: user.id,
            error: error.response?.data || error.message,
          });
        }
      },
      {
        connection,
      }
    );
  }
}