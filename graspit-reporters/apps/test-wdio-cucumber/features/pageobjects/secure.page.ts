/* eslint-disable no-tabs */
/* eslint-disable class-methods-use-this */

import Page from './page';

/**
 * sub page containing specific selectors and methods for a specific page
 */
class SecurePage extends Page {
  /**
	 * define selectors using getter methods
	 */
  public get flashAlert() {
    return $('#flash');
  }
}

export default new SecurePage();
