import Model from './model.js';
import Repository from './repository.js';
import UserModel from './user.js';
import LikeModel from './like.js';

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
        //PARTIE POUR LIKE DU POST
        let likesRepository = new Repository(new LikeModel());
        let usersRepository = new Repository(new UserModel());
        let likes = likesRepository.findByFilter(like => like.PostId == instance.Id)
        let postsLikesTab= [];
        for (let like of likes){
            let user = usersRepository.get(like.UserId);
            if(user) postsLikesTab.push({UserId:like.UserId, PostId:like.PostId, Name:user.Name, Avatar: user.Avatar});
        };
        instance.Likes = postsLikesTab;
        
         
        //PARTIE POUR AUTHOR POST
        let author = new Repository(new UserModel()).get(instance.Author);
        instance.Author = { Id: author.Id, Name: author.Name, Avatar: author.Avatar };
        return instance;
    }
}