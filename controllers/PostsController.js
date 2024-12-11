import PostModel from '../models/post.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';
import AccessControl from '../accessControl.js';
import LikeModel from '../models/like.js';

export default class PostModelsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PostModel()), AccessControl.superUser());
        this.likeRepository = new Repository(new LikeModel());
    }

    head() {
        if (AccessControl.readGranted(this.HttpContext.authorizations, AccessControl.anonymous())) {
            if (this.repository != null) {
                this.HttpContext.response.ETag(this.repository.ETag);
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized("Unauthorized access");
    }
    get(id) {
        if (AccessControl.readGranted(this.HttpContext.authorizations, AccessControl.anonymous())) {
            if (this.repository != null) {
                if (id !== '') {
                    let data = this.repository.get(id);
                    if (data != null)
                        this.HttpContext.response.JSON(data);
                    else
                        this.HttpContext.response.notFound("Ressource not found.");
                } else {
                    let data = this.repository.getAll(this.HttpContext.path.params);
                    if (this.repository.valid())
                        this.HttpContext.response.JSON(data, this.repository.ETag, false, AccessControl.anonymous());
                    else
                        this.HttpContext.response.badRequest(this.repository.errorMessages);
                }
            } else
                this.HttpContext.response.notImplemented();
        } else
            this.HttpContext.response.unAuthorized("Unauthorized access");
    }

    like(id)
    {
        if (AccessControl.readGranted(this.HttpContext.authorizations, AccessControl.user())) {
            if (this.likeRepository != null) {
                if (id !== '') {
                    let data = this.likeRepository.findByFilter(like => like.UserId == this.HttpContext.user.Id && like.PostId == id);
                    
                    if (data.length > 0)
                        this.HttpContext.response.JSON(data);
                    else {
                        let like = {
                            "UserId": this.HttpContext.user.Id,
                            "PostId": id
                        };

                        data = this.likeRepository.add(like);

                        if (this.likeRepository.model.state.isValid) {
                            this.repository.newETag();
                            this.get(id);
                        }
                        else
                            if (this.likeRepository.model.state.inConflict)
                                this.HttpContext.response.conflict(this.likeRepository.model.state.errors);
                            else
                                this.HttpContext.response.badRequest(this.likeRepository.model.state.errors);
                    }
                }
                else
                    this.HttpContext.response.badRequest("Bad request.");
            } else
                this.HttpContext.response.notImplemented();
        }
        else {
            this.HttpContext.response.unAuthorized("Unauthorized access");
        }
    }

    unlike(id)
    {
        if (AccessControl.readGranted(this.HttpContext.authorizations, AccessControl.user())) {
            if (this.likeRepository != null) {
                if (id !== '') {
                    let filterFunc = (like) => {
                        return like.UserId == this.HttpContext.user.Id && like.PostId == id;
                    };

                    if (this.likeRepository.model.state.isValid) {
                        this.likeRepository.removeByFilter(filterFunc);
                        this.repository.newETag();
                        this.get(id);
                    }
                    else
                        if (this.likeRepository.model.state.inConflict)
                            this.HttpContext.response.conflict(this.likeRepository.model.state.errors);
                        else
                            this.HttpContext.response.badRequest(this.likeRepository.model.state.errors);
                } else
                    this.HttpContext.response.badRequest("Bad request.");
            } else
                this.HttpContext.response.notImplemented();
        }
        else {
            this.HttpContext.response.unAuthorized("Unauthorized access");
        }
    }
}