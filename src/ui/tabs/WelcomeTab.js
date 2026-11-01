import colors from '../../util/colors.js';
import blessed from 'reblessed';
import UITab from './UITab.js';

const LOGO = `
$$$$$$$\\  $$\\                                     $$\\     $$\\       
$$  __$$\\ \\__|                                    $$ |    $$ |      
$$ |  $$ |$$\\  $$$$$$$\\ $$$$$$\\$$$$\\  $$\\   $$\\ $$$$$$\\   $$$$$$$\\  
$$$$$$$\\ |$$ |$$  _____|$$  _$$  _$$\\ $$ |  $$ |\\_$$  _|  $$  __$$\\ 
$$  __$$\\ $$ |\\$$$$$$\\  $$ / $$ / $$ |$$ |  $$ |  $$ |    $$ |  $$ |
$$ |  $$ |$$ | \\____$$\\ $$ | $$ | $$ |$$ |  $$ |  $$ |$$\\ $$ |  $$ |
$$$$$$$  |$$ |$$$$$$$  |$$ | $$ | $$ |\\$$$$$$  |  \\$$$$  |$$ |  $$ |
  \\_______/ \\__|\\_______/ \\__| \\__| \\__| \\______/    \\____/ \\__|  \\__|  
`;

const LOGO_HEIGTH = LOGO.split('\n').length;
const LOGO_WIDTH = LOGO.split('\n')[5].length;

// TODO get palette from config (for customization)
const palette = [colors.fg.blue, colors.fg.white];

export default class WelcomeTab extends UITab {
    logoContent = '';
    name = 'welcome';

    generateLogo() {
        this.logoContent = '';

        for (let char of LOGO) {
            if (char === '$') {
                this.logoContent += palette[0] + char;
            } else {
                this.logoContent += palette[1] + char;
            }
        }

        this.logoContent += colors.reset;
    }

    init(styles) {
        this.generateLogo();

        this.addChild('logo-box', blessed.box({
            ...styles['tab0-logo-box'],
            content: this.logoContent
        }));

        this.addChild('separator', blessed.box({
            ...styles['tab0-separator'],
            top: styles['tab0-logo-box'].top + LOGO_HEIGTH,
            content: '~'.repeat(LOGO_WIDTH + 6)
        }));

        this.addChild('hotkeys-box', blessed.box({
            ...styles['tab0-hotkeys-box'],
            top: styles['tab0-logo-box'].top + LOGO_HEIGTH + 2,
            height: "100%-" + `${(styles['tab0-logo-box'].top + LOGO_HEIGTH + 4)}`,
        }));

        super.init(styles);
    }
}