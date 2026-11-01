import { state } from '../app.js';
import WelcomeTab from './tabs/WelcomeTab.js';
import PlaylistTab from './tabs/PlaylistTab.js';
import FilesTab from './tabs/FilesTab.js';
import ConfigTab from './tabs/ConfigTab.js';
import TabHeader from './elements/TabHeader.js';
import UIElement from './elements/UIElement.js';
import UITab from './tabs/UITab.js';

export default class TabManager extends UIElement {
    constructor() {
        super();
        this.addChild('welcome', new WelcomeTab());
        this.addChild('playlist', new PlaylistTab());
        this.addChild('files', new FilesTab());
        this.addChild('config', new ConfigTab());
        this.addChild('header', new TabHeader());
    }

    get tabs() {
        return this.childrenList.filter(child => child instanceof UITab);
    }

    get tabHeader() {
        return this.getChild('header');
    }

    get activeTabIndex() {
        for(let i = 0; i < this.tabs.length; i++) {
            if(this.tabs[i].name == state.get("active-tab"))
                return i;
        }
    }

    get activeTab() {
        return this.tabs[this.activeTabIndex];
    }

    appendTo(parent) {
        super.appendTo(parent);
        for (const tab of this.tabs) {
            tab.hide();
        }
    }

    nextTab() {
        let newTabIndex = (this.activeTabIndex + 1) % this.tabs.length;

        if(newTabIndex == 0){
            newTabIndex = 1;
        }

        const newTab = this.tabs[newTabIndex];

        state.set("active-tab", newTab.name);

        this.tabHeader.changeTab(newTab);
    }

    update() {
        this.activeTab.show();
    }
}