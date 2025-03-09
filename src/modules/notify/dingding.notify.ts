import { INotifier, Level } from "@src/modules/interfaces/notify.interface";
export  class DingdingNotify implements INotifier {
    constructor() {
    }

    refresh(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    notify(title: string, content: string, options?: { level?: Level; sound?: string; icon?: string; group?: string; url?: string; isArchive?: boolean ; }): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    success(title: string, content: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    error(title: string, content: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    warning(title: string, content: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    info(title: string, content: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

}