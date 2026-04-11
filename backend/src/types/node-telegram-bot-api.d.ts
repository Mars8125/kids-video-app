declare module 'node-telegram-bot-api' {
  interface Message {
    chat: {
      id: number
      type: string
      title?: string
      username?: string
      first_name?: string
      last_name?: string
    }
    text?: string
    from?: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    video?: object
    photo?: Array<{ file_id: string; width?: number; height?: number }>
    document?: object
    caption?: string
    message_id: number
    date: number
  }

  interface BotOptions {
    polling?: boolean | object
    webHook?: boolean | object
    cert?: Buffer
    key?: Buffer
    autoStart?: boolean
    streaming?: boolean
  }

  class TelegramBot {
    constructor(token: string, options?: BotOptions)
    on(event: string, callback: (msg: Message, match?: RegExpMatchArray) => void): this
    sendMessage(chatId: number | string, text: string, opts?: object): Promise<Message>
    answerCallbackQuery(callbackQueryId: string, text?: string): Promise<boolean>
    editMessageText(text: string, opts?: object): Promise<Message | boolean>
    getChatMember(chatId: string | number, userId: number | string): Promise<object>
    startPolling(): this
    stopPolling(): Promise<void>
    close(): Promise<void>
    setWebHook(url: string): Promise<boolean>
    deleteWebHook(): Promise<boolean>
    getMe(): Promise<object>
  }

  export = TelegramBot
}
