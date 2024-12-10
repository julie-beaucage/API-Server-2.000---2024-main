import LikeModel from '../models/like.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';
import AccessControl from '../accessControl.js';

export default class LikesController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new LikeModel()), AccessControl.admin());
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

                    let filterFunc = (like) => {
                        return like.PostId == id;
                    };

                    let data = this.repository.findByFilter(filterFunc);

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
            if (this.repository != null) {
                if (id !== '') {
                    let data = this.repository.findByFilter(like => like.UserId == this.HttpContext.user.Id && like.PostId == id);
                    
                    if (data.length > 0)
                        this.HttpContext.response.JSON(data);
                    else {
                        let like = {
                            "UserId": this.HttpContext.user.Id,
                            "PostId": id
                        };

                        data = this.repository.add(like);

                        if (this.repository.model.state.isValid)
                            this.get(id);
                        else
                            if (this.repository.model.state.inConflict)
                                this.HttpContext.response.conflict(this.repository.model.state.errors);
                            else
                                this.HttpContext.response.badRequest(this.repository.model.state.errors);
                    }
                }
                else
                    this.HttpContext.response.badRequest("Bad request.");
            } else
                this.HttpContext.response.notImplemented();
        }
        else {
            console.log("no");
            this.HttpContext.response.unAuthorized("Unauthorized access");
        }
    }

    unlike(id)
    {
        if (AccessControl.readGranted(this.HttpContext.authorizations, AccessControl.user())) {
            if (this.repository != null) {
                if (id !== '') {
                    let filterFunc = (like) => {
                        return like.UserId == this.HttpContext.user.Id && like.PostId == id;
                    };

                    this.repository.removeByFilter(filterFunc)
                    this.get(id);
                } else
                    this.HttpContext.response.badRequest("Bad request.");
            } else
                this.HttpContext.response.notImplemented();
        }
        else {
            console.log("no");
            this.HttpContext.response.unAuthorized("Unauthorized access");
        }
    }
}