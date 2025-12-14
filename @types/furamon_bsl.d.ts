type Metadata = Record<string, any>;

declare global {
  interface MetaObject {
    meta: Metadata;
  }

  interface Window_BattleStateList extends Window_Selectable {
    openness: number;
    contents: Bitmap;
    active: boolean;
    isOpen(): boolean;
    isClosed(): boolean;
    open(): void;
    close(): void;
    activate(): void;
    deactivate(): void;

    _dataStates: MZ.State[];
    makeItemList(): void;
    refresh(): void;
  }

  interface Scene_Battle {
    _openedStateListFrom: string | null;
    _stateListWindow: Window_BattleStateList;
    createStateListWindow(): void;
    stateListWindowRect(): Rectangle;
    updateStateListWindow(): void;
    isStateListTriggered(): boolean;
    toggleStateListWindow(): void;
    openStateListWindow(): void;
    closeStateListWindow(): void;
  }

  interface Window_TemporaryText extends Window_Base {
    padding: number;
    opacity: number;
    openness: number;
    contentsOpacity: number;
    width: number;
    height: number;
    contents: Bitmap;
  }

  interface Window_PartyCommand {
    active: boolean;
    show(): void;
    hide(): void;
  }

  interface Window_ActorCommand {
    active: boolean;
    show(): void;
    hide(): void;
  }

  declare var AdditionalClass: any;
}

export {};
