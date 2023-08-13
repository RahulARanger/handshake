export default class ContactList {
    port = 6969;

    get url() {
        return `http://127.0.0.1:${this.port}`;
    }
}
