import Model from './model.js';
import Repository from './repository.js';
import UserModel from './user.js';

export default class Post extends Model {
    constructor() {
        super(true /* secured Id */);

        this.addField('Title', 'string');
        this.addField('Text', 'string');
        this.addField('Category', 'string');
        this.addField('Image', 'asset');
        this.addField('Date', 'integer');
        this.addField('Author', 'string');

        this.setKey("Title");
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);

        let author = new Repository(new UserModel()).get(instance.Author);
        console.log(instance);
        instance.Author = { Id: author.Id, Name: author.Name, Avatar: author.Avatar };
        return instance;
    }
}