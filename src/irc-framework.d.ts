declare module "irc-framework" {
  export class Client {
    connect(options: { host: string; port: number; nick: string }): void;
    join(channel: string): void;
    say(target: string, message: string, tags?: Record<string, string>): void;
    quit(message?: string): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
  }
}
