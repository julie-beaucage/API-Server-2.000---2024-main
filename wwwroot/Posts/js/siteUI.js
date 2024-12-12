////// Author: Nicolas Chourot
////// 2024
//////////////////////////////

const periodicRefreshPeriod = 2;
const waitingGifTrigger = 2000;
const minKeywordLenth = 3;
const keywordsOnchangeDelay = 500;

let categories = [];
let selectedCategory = "";
let currentETag = "";
let currentPostsCount = -1;
let periodic_Refresh_paused = false;
let postsPanel;
let usersPanel;
let itemLayout;
let waiting = null;
let showKeywords = false;
let keywordsOnchangeTimger = null;
let timeoutTime = 600; // 10 minutes

Init_UI();

async function Init_UI() {
    loggedUser = Posts_API.retrieveLoggedUser();
    postsPanel = new PageManager('postsScrollPanel', 'postsPanel', 'postSample', renderPosts);
    $('#createPost').on("click", async function () {
        showCreatePostForm();
    });
    $('#abort').on("click", async function () {
        if(loggedUser){
            timeout(timeoutTime);
        }
        showPosts();
    });
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $("#showSearch").on('click', function () {
        toogleShowKeywords();
        showPosts();
    });
    installKeywordsOnkeyupEvent();
    if(loggedUser){
        timeout(timeoutTime);
        if(loggedUser!="verified"){
            renderVerify();
        }
    }
    await showPosts();
    start_Periodic_Refresh();
}


/////////////////////////// Search keywords UI //////////////////////////////////////////////////////////

function installKeywordsOnkeyupEvent() {
    $("#searchKeys").on('keyup', function () {
        clearTimeout(keywordsOnchangeTimger);
        keywordsOnchangeTimger = setTimeout(() => {
            cleanSearchKeywords();
            showPosts(true);
        }, keywordsOnchangeDelay);
    });
    $("#searchKeys").on('search', function () {
        showPosts(true);
    });
}
function cleanSearchKeywords() {
    /* Keep only keywords of 3 characters or more */
    let keywords = $("#searchKeys").val().trim().split(' ');
    let cleanedKeywords = "";
    keywords.forEach(keyword => {
        if (keyword.length >= minKeywordLenth) cleanedKeywords += keyword + " ";
    });
    $("#searchKeys").val(cleanedKeywords.trim());
}
function showSearchIcon() {
    $("#hiddenIcon").hide();
    $("#showSearch").show();
    if (showKeywords) {
        $("#searchKeys").show();
    }
    else
        $("#searchKeys").hide();
}
function hideSearchIcon() {
    $("#hiddenIcon").show();
    $("#showSearch").hide();
    $("#searchKeys").hide();
}
function toogleShowKeywords() {
    showKeywords = !showKeywords;
    if (showKeywords) {
        $("#searchKeys").show();
        $("#searchKeys").focus();
    }
    else {
        $("#searchKeys").hide();
        showPosts(true);
    }
}

/////////////////////////// Views management ////////////////////////////////////////////////////////////

function intialView() {
    $("#createPost").hide();
    $("#hiddenIcon").hide();
    $("#hiddenIcon2").hide();
    $('#menu').show();
    $('#commit').hide();
    $('#abort').hide();
    $('#form').hide();
    $('#form').empty();
    $('#aboutContainer').hide();
    $('#errorContainer').hide();
    $('#userManagerContainer').hide();
    let loggedUser = Posts_API.retrieveLoggedUser();
    if(loggedUser && loggedUser.isSuper){
        //timeout(timeoutTime);
        $("#header").css('grid-template-columns', '70px auto 36px 36px 30px 30px');
        $("#createPost").show();
    }else { 
        $("#header").css('grid-template-columns', '70px auto 36px 36px 30px');
    }
    showSearchIcon();
}
async function showPosts(reset = false) {
    let loggedUser = Posts_API.retrieveLoggedUser();
    if(loggedUser){
        if(loggedUser!="verified"){
            renderVerify();
        }
    }
    if(loggedUser && loggedUser.isSuper){
        timeout(timeoutTime);
        $("#createPost").show();
    }else { 
        $("#header").css('grid-template-columns', '70px auto 36px 36px 30px');
        }
    intialView();
    $("#viewTitle").text("Fil de nouvelles");
    periodic_Refresh_paused = false;
    await postsPanel.show(reset);
}
function showUsers() {
    hidePosts();
    $('#userManagerContainer').show();
    renderUsers();
    $('#abort').show();
    $("#viewTitle").text("Gestions des usagers");
}
function hideUsers() {
    $('#userManagerContainer').hide();
    $("#createUser").hide();
    $('#menu').hide();
    periodic_Refresh_paused = true;
}
function hidePosts() {
    let loggedUser = Posts_API.retrieveLoggedUser();
    if(loggedUser){
        timeout(timeoutTime);
    }
    postsPanel.hide();
    hideSearchIcon();
    $("#createPost").hide();
    $("#usersScrollPanel").hide();
    $('#menu').hide();
    periodic_Refresh_paused = true;
}
function showForm() {
    hidePosts();
    $("#createPost").hide();
    $('#form').show();
    $('#commit').show();
    $('#abort').show();
}
function hideForm() {
    $('#form').hide();
    $('#form').empty();
    $('#commit').hide();
}
function showError(message, details = "",title="Erreur du serveur...") {
    if (Posts_API.currentStatus == 401) 
        return;
    hidePosts();
    $('#form').hide();
    $('#form').empty();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#commit').hide();
    $('#abort').show();
    $("#viewTitle").text(title);
    $("#errorContainer").show();
    $("#errorContainer").empty();
    $("#errorContainer").append($(`<div>${message}</div>`));
    $("#errorContainer").append($(`<div>${details}</div>`));
    if (message.includes("titre incorrect") || message.includes("Code de vérification incorrecte")) {
        let button = $(`
            <div class="login-container">
                <button name="button" id="loginButton" class="nouveau_btn btn btn-primary">
                    Connexion
                </button>
            </div>
        `);

        $("#errorContainer").append(button);
        $('#loginButton').on("click", async function () {
            Posts_API.lastEmail = "";
            showLoginForm();
        });
    }
}

function showLoginForm(message=null) {
    intialView();
    showForm();
    $("#viewTitle").text("Ajout de nouvelle");
    $('#commit').hide();
    renderLoginProfil(message);
}
function showEditProfileForm(id){
    showForm();
    $("#viewTitle").text("Modification");
    renderEditUserForm(id);
}
function showDeleteUser(User){
    showForm();
    $("#viewTitle").text("Effacer le compte");
    console.log(User);
    message="Voulez-vous vraiment effacer votre compte?";
    renderDeleteUserForm(User, message);
}
function showCreatePostForm() {
    showForm();
    $("#viewTitle").text("Ajout de nouvelle");
    renderPostForm();
}
function showEditPostForm(id) {
    showForm();
    $("#viewTitle").text("Modification");
    renderEditPostForm(id);
}
function showDeletePostForm(id) {
    showForm();
    $("#viewTitle").text("Retrait");
    renderDeletePostForm(id);
}
function showAbout() {
    hidePosts();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#abort').show();
    $("#viewTitle").text("À propos...");
    $("#aboutContainer").show();
}

//////////////////////////// USER rendering /////////////////////////////////////////////////////////////
async function renderUsers() {
    let users = await Posts_API.getUsers();
    if (!Posts_API.error) {
        $('#userManagerContainer').empty();
        currentId = Posts_API.retrieveLoggedUser().Id;
        if (users.length > 0) {
            users.forEach(user => {
                if (user.Id == currentId) return;
                $('#userManagerContainer').append(renderUser(user));
            });
        } 
    } else {
        showError(Posts_API.currentHttpError);
    }
}
function renderUser(user, loggedUser) {
    let roleIcon;
    if (user.isAdmin) {
        roleIcon = `<i class="fas fa-user-tie " title="Administrateur" style="color: #007bff;"></i>`;
    } else if (user.isSuper) {
        roleIcon = `<i class="fas fa-user-astronaut" title="Super Utilisateur" style="color: #ffc107;"></i>`;
    } else {
        roleIcon = `<i class="fa fa-user" title="Utilisateur" style="color: #6c757d;"></i>`;
    }
    let crudIcon =`     
       <span id="promoteUserCmd" class="promoteUserCmd cmdIconSmallUser">
         ${roleIcon}
       </span>
        <span id="blockUser" class="blockUserCmd cmdIconSmall fa-stack fa-lg" 
            postId="${user.Id}" 
            title="${user.isBlocked ? "Débloquer usager" : "Bloquer usager"}">
        <i class="fa-solid ${user.isBlocked ? "fa-ban" : "fa-circle-check"} ${user.isBlocked ? "icon-red" : "icon-green"}"></i>
        </span>
    <span id="deleteUserCmd" class="deleteCmd cmdIconSmallUser fa fa-trash" postId="${user.Id}" title="Effacer usager"></span>
    `;
    let $userElement = $(`
        <div class="user" id="${user.Id}"> 
            <div class="userContainer noselect">
                <div class="userLayout">
                    <div class="avatar" style="background-image:url('${user.Avatar}')"></div>
                    <div class="userInfo">
                        <span class="contactName">${user.Name}</span>
                        <a href="mailto:${user.Email}" class="contactEmail" target="_blank" >${user.Email}</a>
                    </div>
                </div>
                <div class="userCommandPanel">
                    ${crudIcon}
                </div>
            </div>
        </div>
    `);
    $userElement.find(".promoteUserCmd").on("click", async function () {
        Posts_API.promoteUser(user);
        renderUsers();
    });
    /*$userElement.find(".deleteCmd").on("click", async function () {
        if (confirm("Voulez-vous vraiment effacer cet usager?")) {
            Posts_API.removeUser(user.Id);
            renderUsers();
        }
    });*/
     
      $userElement.find(".deleteCmd").on("click", async function () {
         modalDelete();
         $('#confirmDeleteModal').modal('show'); 
         $('#confirmDeleteBtn').off('click').on('click', async function () { 
            Posts_API.removeUser(user.Id); 
            renderUsers(); $('#confirmDeleteModal').modal('hide'); });
        });
    
         $userElement.find(".blockUserCmd").on("click", async function () {
        Posts_API.blockUser(user);
        renderUsers();
    });
    return $userElement;
}

function modalDelete() {
    const modalHTML = `
    <div class="modal fade" id="confirmDeleteModal" tabindex="-1" role="dialog" aria-labelledby="confirmDeleteModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="confirmDeleteModalLabel">Confirmer la suppression</h5>
                    <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    Voulez-vous vraiment effacer cet usager ?
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Effacer</button>
                </div>
            </div>
        </div>
    </div>`;
    
    $('body').append(modalHTML);
}


//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

function start_Periodic_Refresh() {
    $("#reloadPosts").addClass('white');
    $("#reloadPosts").on('click', async function () {
        $("#reloadPosts").addClass('white');
        postsPanel.resetScrollPosition();
        await showPosts();
    })
    setInterval(async () => {
        if (!periodic_Refresh_paused) {
            let etag = await Posts_API.HEAD();
            // the etag contain the number of model records in the following form
            // xxx-etag
            let postsCount = parseInt(etag.split("-")[0]);
            if (currentETag != etag) {           
                if (postsCount != currentPostsCount) {
                    console.log("postsCount", postsCount)
                    currentPostsCount = postsCount;
                    $("#reloadPosts").removeClass('white');
                } else
                    await showPosts();
                currentETag = etag;
            }
        }
    },
        periodicRefreshPeriod * 1000);
}
async function renderPosts(queryString) {
    let endOfData = false;
    queryString += "&sort=date,desc";
    loggedUser = Posts_API.retrieveLoggedUser();
    compileCategories();
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    if (showKeywords) {
        let keys = $("#searchKeys").val().replace(/[ ]/g, ',');
        if (keys !== "")
            queryString += "&keywords=" + $("#searchKeys").val().replace(/[ ]/g, ',')
    }
    addWaitingGif();
    let response = await Posts_API.Get(queryString);
    if (!Posts_API.error) {
        currentETag = response.ETag;
        currentPostsCount = parseInt(currentETag.split("-")[0]);
        let Posts = response.data;
        if (Posts.length > 0) {

            for (let i = 0; i < Posts.length; i++) {
                let post = renderPost(Posts[i]);
                postsPanel.append(post);
            }
        } else
            endOfData = true;

        linefeeds_to_Html_br(".postText");
        highlightKeywords();
        attach_Posts_UI_Events_Callback();
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;
}
function renderPost(post) {
    let loggedUser = Posts_API.retrieveLoggedUser();
    let likes = post.Likes;
    let date = convertToFrenchDate(UTC_To_Local(post.Date));
    let crudIcon=`
    <span>&nbsp</span>
    <span>&nbsp</span>
  `;
    let likers = likes.map(like => like.Name).join("\n");

    if(!loggedUser) //Personne ayant access Anonym
    {
        crudIcon=`
          <span>&nbsp</span>
          <span>&nbsp</span>
        `;
    } else {
        if(loggedUser.Id == post.Author.Id){ 
            crudIcon =  `
            <span class="editCmd cmdIconSmall fa fa-pencil" postId="${post.Id}" title="Modifier nouvelle"></span>
            <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
            `;

        } else {
            if(loggedUser.isAdmin)
            {
                crudIcon = `
                <span>&nbsp</span>
                <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
                `;
            } 
        }
        if (likes.find(like => like.UserId == loggedUser.Id)) {
            crudIcon +=`
            <span class="toggleLikeCmd cmdIconSmall fa-solid fa-thumbs-up" postId="${post.Id}" isLiked="true" title="Ne plus aimer la nouvelle"></span>
            <span class="cmdIconSmall" title="${likers}">${post.Likes.length}</span>
            `;
        } else {
            crudIcon +=`
            <span class="toggleLikeCmd cmdIconSmall fa-regular fa-thumbs-up" postId="${post.Id}" isLiked="false" title="Aimer la nouvelle"></span>
            <span class="cmdIconSmall" title="${likers}">${post.Likes.length}</span>
            `;
        }
    } 
    return $(`
        <div class="post" id="${post.Id}">
            <div class="postHeader">
                ${post.Category}
                ${crudIcon}
            </div>
            <div class="postTitle"> ${post.Title} </div>
            <img class="postImage" src='${post.Image}'/>
            <div class="flex-row postInfo">
                <div class="flex-row">
                    <div class="" style="background-image: url('${post.Author.Avatar}'); margin-right:0.7em; width: 40px; height: 40px; background-size: cover; border-radius: 50%;">
                    </div>
                    <b class="">${post.Author.Name}</b>
                </div>
                <div class="postDate"> ${date} </div>
            </div>
            <div postId="${post.Id}" class="postTextContainer hideExtra">
                <div class="postText" >${post.Text}</div>
            </div>
            <div class="postfooter">
                <span postId="${post.Id}" class="moreText cmdIconXSmall fa fa-angle-double-down" title="Afficher la suite"></span>
                <span postId="${post.Id}" class="lessText cmdIconXSmall fa fa-angle-double-up" title="Réduire..."></span>
            </div>         
        </div>
    `);
}
async function compileCategories() {
    categories = [];
    let response = await Posts_API.GetQuery("?fields=category&sort=category");
    if (!Posts_API.error) {
        let items = response.data;
        if (items != null) {
            items.forEach(item => {
                if (!categories.includes(item.Category))
                    categories.push(item.Category);
            })
            if (!categories.includes(selectedCategory))
                selectedCategory = "";
            updateDropDownMenu(categories);
        }
    }
}
function updateDropDownMenu() {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    let loggedUser = Posts_API.retrieveLoggedUser();
    DDMenu.empty();
    if (loggedUser&&loggedUser.VerifyCode=="verified") {
        loggedUserMenu();
        DDMenu.append($(`<div class="dropdown-divider"></div>`));
    }else{
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="login">
            <i class="menuIcon fa fa-fw mx-2"></i> Connexion
        </div>
        `));
        DDMenu.append($(`<div class="dropdown-divider"></div>`));
    }
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $('#allCatCmd').on("click", async function () {
        selectedCategory = "";
        await showPosts(true);
        updateDropDownMenu();
    });
    $('.category').on("click", async function () {
        selectedCategory = $(this).text().trim();
        await showPosts(true);
        updateDropDownMenu();
    });
    $('#login').on("click", async function () {
        Posts_API.lastEmail = "";
        showLoginForm();
    });
    $('#editProfileCmd').on('click', function () {
        showEditProfileForm(); 
    });
}

function loggedUserMenu(){
    let loggedUser= Posts_API.retrieveLoggedUser();
    if(loggedUser){
        let connectedUser=(`
            <span class="dropdown-item " id="editProfileMenuCmdFromAvatar">
             <div class="loggedUserItemMenuLayout">
                 <div class="" style="background-image: url('${loggedUser.Avatar}'); margin-right:0.7em; width: 40px; height: 40px; background-size: cover; border-radius: 50%;">
                 </div>
                 <span class="">${loggedUser.Name}</span>
              </div>
            </span>        
        `);
        $("#DDMenu").prepend(connectedUser); 
        if(loggedUser.isAdmin){
            $("#DDMenu").append($(`<div class="dropdown-divider"></div>`));
            $("#DDMenu").append(`
                <div class="dropdown-item menuItemLayout" id="gestionUser">
                    <i class="menuIcon fas fa-user-cog mx-2"></i> Gestion des usagers
                </div>
            `);
        }
        $("#DDMenu").append($(`<div class="dropdown-divider"></div>`));
        $("#DDMenu").append(`
            <div class="dropdown-item menuItemLayout" id="editProfile">
                <i class="menuIcon fas fa-user-edit mx-2"></i> Modifier votre profil
            </div>
        `);
        $("#DDMenu").append(`
            <div class="dropdown-item menuItemLayout" id="logoutCmd">
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion
            </div>
        `);
        $('#editProfile').on("click", function () {
            showEditProfileForm(loggedUser); 
        });
        $('#gestionUser').on("click", function () {
            showUsers();
        });

        $('#logoutCmd').on("click", function () {
            Posts_API.logout();
            location.reload();
        });
    }
}
function attach_Posts_UI_Events_Callback() {

    linefeeds_to_Html_br(".postText");
    // attach icon command click event callback
    $(".editCmd").off();
    $(".editCmd").on("click", function () {
        showEditPostForm($(this).attr("postId"));
    });
    $(".deleteCmd").off();
    $(".deleteCmd").on("click", function () {
        showDeletePostForm($(this).attr("postId"));
    });
    $(".moreText").off();
    $(".moreText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).show();
        $(`.lessText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('showExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('hideExtra');
    })
    $(".lessText").off();
    $(".lessText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).hide();
        $(`.moreText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        postsPanel.scrollToElem($(this).attr("postId"));
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('hideExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('showExtra');
    })

    $('.toggleLikeCmd').off();
    $('.toggleLikeCmd').on('click', async function () {
        let postId = $(this).attr("postId");
        let isLiked = $(this).attr("isLiked") == "true";
        let response = null;
        if (isLiked) {
            response = await Posts_API.Unlike(postId);
        }
        else {
            response = await Posts_API.Like(postId);
        }

        if (!Posts_API.error) {
            $(this).attr("isLiked", !isLiked);
            $(this).toggleClass("fa-regular");
            $(this).toggleClass("fa-solid");
            let likers = response.Likes.length;
            $(this).next().text(likers);
        }
    });
}
function addWaitingGif() {
    clearTimeout(waiting);
    waiting = setTimeout(() => {
        postsPanel.itemsPanel.append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
    }, waitingGifTrigger)
}
function removeWaitingGif() {
    clearTimeout(waiting);
    $("#waitingGif").remove();
}

/////////////////////// Posts content manipulation ///////////////////////////////////////////////////////


function linefeeds_to_Html_br(selector) {
    $.each($(selector), function () {
        let postText = $(this);
        var str = postText.html();
        var regex = /[\r\n]/g;
        postText.html(str.replace(regex, "<br>"));
    })
}
function highlight(text, elem) {
    text = text.trim();
    if (text.length >= minKeywordLenth) {
        var innerHTML = elem.innerHTML;
        let startIndex = 0;

        while (startIndex < innerHTML.length) {
            var normalizedHtml = innerHTML.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            var index = normalizedHtml.indexOf(text, startIndex);
            let highLightedText = "";
            if (index >= startIndex) {
                highLightedText = "<span class='highlight'>" + innerHTML.substring(index, index + text.length) + "</span>";
                innerHTML = innerHTML.substring(0, index) + highLightedText + innerHTML.substring(index + text.length);
                startIndex = index + highLightedText.length + 1;
            } else
                startIndex = innerHTML.length + 1;
        }
        elem.innerHTML = innerHTML;
    }
}
function highlightKeywords() {
    if (showKeywords) {
        let keywords = $("#searchKeys").val().split(' ');
        if (keywords.length > 0) {
            keywords.forEach(key => {
                let titles = document.getElementsByClassName('postTitle');
                Array.from(titles).forEach(title => {
                    highlight(key, title);
                })
                let texts = document.getElementsByClassName('postText');
                Array.from(texts).forEach(text => {
                    highlight(key, text);
                })
            })
        }
    }
}

//////////////////////// Forms rendering /////////////////////////////////////////////////////////////////
async function renderEditUserForm(id) {
    $('#commit').show();
    addWaitingGif();
    let response= await Posts_API.retrieveLoggedUser();
    if (!Posts_API.error) {
        if ( response !== null)
            await renderFormProfile( response);
        else
            showError("Post introuvable!");
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
}
function renderDeleteUserForm(user,message=null) {
    if (user !== null) {
        $("#form").empty();
        $('#commit').hide();
        $('#abort').hide();
        $("#form").append(`
            <div class="user" id="${user.Id}"> 
                <div class="userContainer noselect">
                    <div class="userLayout">
                        <div class="avatar" style="background-image:url('${user.Avatar}')"></div>
                        <div class="userInfo">
                            <span class="contactName">${user.Name}</span>
                            <a href="mailto:${user.Email}" class="contactEmail" target="_blank" >${user.Email}</a>
                        </div>
                    </div>
                </div>
            </div>
            <div>
            <p class="delete_text_message">${message}</p>
            <input type="submit" value="Effacer le compte" id="deleteUser" class="delete_profile_btn btn btn-primary">
            </br><br>
            <input type="button" value="Annuler" id="cancel" class="login_btn btn btn-secondary">            
            </div>
        `);
        $('#deleteUser').on("click", async function () {
            await Posts_API.removeUser(user.Id);
            if (Posts_API.error) {
                showError("Une erreur est survenue!");
            }
            Posts_API.logout();
            Posts_API.lastEmail = "";
            showLoginForm();
        });
        $('#cancel').on("click", async function () {
            showPosts();
        });

    } else {
        showError("Utilisateur introuvable!");
    }
}
function newUser() {
    let User = {};
    User.Id = 0;
    User.Created = Local_to_UTC(Date.now());
    User.Name = "";
    User.Email = "";
    User.Password = "";
    User.VerifyCode = "";
    User.Avatar = "no-avatar.png";
    return User;
}

async function verify(Code){
    let user = Posts_API.retrieveLoggedUser();
        if ( user  !== null){
            let verif_response = await Posts_API.verifyUserProfile(user, Code); // Attendre le résultat de la promesse
            if (verif_response) {
               showPosts();
           }else{
               showError("Code de vérification incorrecte","Veuillez réessayer en vous connectant","Erreur de code");
           }
        }
        else
             showError("utilisateur introuvable!");

}

function renderVerify(){
    $("#form").empty();
    $("#form").append(`
        <fieldset>
         <legend> Verifications</legend>
         <form class="form" id="verifyForm">
           <p>Veuillez entrer le code de vérification que vous avez reçu par courriel </p>
           <br><br>
           <input type="text"
                  name="Code"
                  class="form-control"
                  required
                  RequireMessage="Veuillez entrer un titre"
                  InvalidMessage="Le code est invalide"
                  placeholder = "Code de verification de couriel"
                  value="" />
            <br/>
            <input type="submit" name ="submit" value="Vérifier" id="savePost" class="btn btn-primary">
        </fieldset>
    `);
    initFormValidation();
    $('#verifyForm').on("submit", function(event){
       let verifyForm = getFormData($('#verifyForm'));
       event.preventDefault();
       verify(verifyForm.Code);
    });  
}

function renderLoginProfil(message=null,messageErreur=null){
    let user = Posts_API.retrieveLoggedUser();
    $("#viewTitle").text("Connexion");
    $("#form").empty();
    $("#form").append(`
        <form class="form" id ="loginProfilForm">
            <div class="messageContainerErreur">
                <div class="error-message" style="color: red; id="errorMessage" >${messageErreur??""}</div>
            </div>
            <div class="messageContainer">
                <div class="message" id="Message" >${message??""}</div>
            </div>
            <input type="email"
                 class="form-control Email"
                 name="Email"
                 placeholder="Courriel"
                 required
                 RequireMessage="Veuillez entrer un courriel"
                 InvalidMessage="Courriel introuvable"
                 CustomErrorMessage="Courriel introuvable"
                 value="${user ? user.Email : Posts_API.lastEmail}"/>
                 <div class="error-message" style="color: red;" id="email-error" ></div>
                 </br>
            <input type="password"
                class="form-control Password"
                name="Password"
                placeholder="Mot de passe"
                required
                RequireMessage="Veuillez entrer un mot de passe"
                InvalidMessage="Mot de passe incorrect"
                value=""/>
            <div class="error-message"  style="color: red;" id="password-error"></div>
            <br/>
            <input type="submit" name ="submit" value="Entrer" id="loginButton" class="login_btn btn btn-primary" >
            <hr>
            <input type="button" name ="button" value="Nouveau compte" id="createAccountButton" class="nouveau_btn btn btn-primary ">
        </form>
    `);
    initFormValidation(); 
    $("#loginProfilForm").on("submit", async function (event)  {
        event.preventDefault();
        $(".error-message").text("");
        let user = getFormData($("#loginProfilForm"));
        user = await Posts_API.login(user);
        if (!Posts_API.error) {
            if(user.VerifyCode=="verified"){
                timeout(timeoutTime);
                loggedUserMenu();
                await showPosts();
            }else{
                renderVerify();
            }
        }
        else{
            let errors = Posts_API.currentHttpError;
            if (errors.includes("email"))  {
                $("#email-error").text(errors);
                $("#password-error").show();
            }
            if (errors.includes("Mot de passe")) {
                $("#password-error").text(errors);
                $("#password-error").show();
            }
            else{
                console.log(Posts_API.currentHttpError);
            }
        }
       // $("#errorMessage").text("Mot de passe incorrect").show();
            //showError("Une erreur est survenue! ", Posts_API.currentHttpError);
    });
    $("#createAccountButton").on("click", async function () {
        await renderFormProfile(); 
    });
}

async function renderFormProfile(User = null, message = null) {
    let create = User == null;
    if (create) User = newUser();
    $("#header").css('grid-template-columns', '70px auto 36px 36px 30px');
    $("#viewTitle").text(create ? "Inscription" : "Modifier le profil");
    $("#form").empty();
    $('#commit').hide();
    $("#form").append(`
        <div class="messageContainer">
            <div class="error-message" style="color: red;" id="errorMessage">${message ?? ""}</div>
        </div>
        <form class="form" id="createProfilForm">
            <input type="hidden" name="Id" value="${User.Id}" />
            <input type="hidden" name="Created" value="${User.Created}" />
            <fieldset>
                <legend>Adresse de courriel</legend>
                <input 
                    id="Email" 
                    class="form-control Email"
                    name="Email"
                    placeholder="Courriel"
                    CustomErrorMessage="Ce courriel est déjà utilisé"
                    RequireMessage="Veuillez entrer un courriel"
                    InvalidMessage="Le format du courriel est invalide"
                    value="${User.Email}" />
                </br>
                <input type="email"
                    class="form-control EmailVerification MatchedInput"
                    name="Email"
                    placeholder="Verification"
                    CustomErrorMessage="Ce courriel ne correspond pas"
                    matchedInputId="Email"
                />
            </fieldset>
            <fieldset>
                <legend>Mot de passe</legend>
                <input 
                    type="password"
                    class="form-control Password"
                    name="Password"
                    placeholder="Mot de passe"
                    value=""
                />
                </br>
                <input 
                    type="password"
                    class="form-control Password"
                    name="ConfirmPassword"
                    placeholder="Verification"
                    CustomErrorMessage="Les mots de passe ne correspondent pas"
                    matchedInputId="Password"
                />
            </fieldset>
            <fieldset>
                <legend>Nom</legend>
                <input 
                    type="text"
                    class="form-control text"
                    name="Name"
                    placeholder="Nom"
                    value="${User.Name}" />
            </fieldset>
            <fieldset>
                <legend>Avatar</legend>
                <div class='imageUploaderContainer'>
                    <div class='imageUploader' 
                        newImage='${create}' 
                        controlId='Avatar' 
                        imageSrc='${User.Avatar}' 
                        waitingImage="Loading_icon.gif">
                    </div>
                </div>
            </fieldset>
            <input type="submit" value="Enregistrer" id="saveUser" class="login_btn btn btn-primary">
            </br><br>
            <input type="button" name="button" value="Effacer le compte" id="deleteAccountButton" class="delete_user_btn btn btn-primary">
        </form>
    `);
    initImageUploaders();
    initFormValidation();
    const serviceUrl = `${Posts_API.serverHost()}/accounts/conflict`;
    addConflictValidation(serviceUrl, "Email", "saveUser");
    if (create) {
        $("#deleteAccountButton").hide();
        $("#saveUser").show();
        
    } 
    $('#createProfilForm').on("submit", async function (event) {
        event.preventDefault();
        let user = getFormData($("#createProfilForm"));
        if (!user.Email || user.Email === "") {
            user.Email = User.Email;
        }
        delete user.ConfirmEmail;
        delete user.ConfirmPassword;
        if (user.Password === "************")
            user.Password = '';
        let response;

        if (create) {
            response = await Posts_API.registerUserProfile(user);
        } else {
            response = await Posts_API.modifyUserProfile(user);
        }
        if (!Posts_API.error) {
            if (create) {
                let message = "Votre compte a été créé. Veuillez vérifier vos courriels pour récupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion.";
                renderLoginProfil(message);
            } else {
                let message = "Modifications enregistrées";
                let response = await Posts_API.retrieveLoggedUser();
                await renderFormProfile(response, message);
            }
        } else {
            showError("Une erreur est survenue! ", Posts_API.currentHttpError);
        }
    });
    $('#cancel').on("click", async function () {
        await showPosts();
    });
    $("#deleteAccountButton").on("click", async function () {
        showDeleteUser(User)
    });
}


//////////////////////// Forms rendering (POST) /////////////////////////////////////////////////////////////////

async function renderEditPostForm(id) {
    $('#commit').show();
    addWaitingGif();
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let Post = response.data;
        if (Post !== null)
            renderPostForm(Post);
        else
            showError("Post introuvable!");
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeletePostForm(id) {
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let post = response.data;
        if (post !== null) {
            let date = convertToFrenchDate(UTC_To_Local(post.Date));
            $("#header").css('grid-template-columns', '70px auto 36px 36px 30px 30px');
            $("#form").append(`
                <div class="post" id="${post.Id}">
                <div class="postHeader">  ${post.Category} </div>
                <div class="postTitle ellipsis"> ${post.Title} </div>
                <img class="postImage" src='${post.Image}'/>
                <div class="postDate"> ${date} </div>
                <div class="postTextContainer showExtra">
                    <div class="postText">${post.Text}</div>
                </div>
            `);
            linefeeds_to_Html_br(".postText");
            // attach form buttons click event callback
            $('#commit').on("click", async function () {
                await Posts_API.Delete(post.Id);
                if (!Posts_API.error) {
                    await showPosts();
                }
                else {
                    console.log(Posts_API.currentHttpError)
                    showError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", async function () {
                await showPosts();
            });

        } else {
            showError("Post introuvable!");
        }
    } else
        showError(Posts_API.currentHttpError);
}
function newPost() {
    let Post = {};
    Post.Id = 0;
    Post.Title = "";
    Post.Text = "";
    Post.Image = "news-logo-upload.png";
    Post.Category = "";
    return Post;
}
function renderPostForm(Post = null) {
    let create = Post == null;
    if (create) Post = newPost();
    $("#form").show();
    $("#form").empty();
    $("#header").css('grid-template-columns', '70px auto 36px 36px 30px 30px');
    $("#form").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${Post.Id}"/>
             <input type="hidden" name="Date" value="${Post.Date}"/>
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${Post.Category}"
            />
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal"
                value="${Post.Title}"
            />
            <label for="Url" class="form-label">Texte</label>
             <textarea class="form-control" 
                          name="Text" 
                          id="Text"
                          placeholder="Texte" 
                          rows="9"
                          required 
                          RequireMessage = 'Veuillez entrer une Description'>${Post.Text}</textarea>

            <label class="form-label">Image </label>
            <div class='imageUploaderContainer'>
                <div class='imageUploader' 
                     newImage='${create}' 
                     controlId='Image' 
                     imageSrc='${Post.Image}' 
                     waitingImage="Loading_icon.gif">
                </div>
            </div>
            <div id="keepDateControl">
                <input type="checkbox" name="keepDate" id="keepDate" class="checkbox" checked>
                <label for="keepDate"> Conserver la date de création </label>
            </div>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary displayNone">
        </form>
    `);
    if (create) $("#keepDateControl").hide();

    initImageUploaders();
    initFormValidation(); // important do to after all html injection!

    $("#commit").click(function () {
        $("#commit").off();
        return $('#savePost').trigger("click");
    });
    $('#postForm').on("submit", async function (event) {
        let loggedUser = Posts_API.retrieveLoggedUser();
        event.preventDefault();
        let post = getFormData($("#postForm"));
        post.Author = loggedUser.Id;
        if (post.Category != selectedCategory)
            selectedCategory = "";
        if (create || !('keepDate' in post))
            post.Date = Local_to_UTC(Date.now());
        delete post.keepDate;
        post = await Posts_API.Save(post, create);
        if (!Posts_API.error) {
            await showPosts();
            postsPanel.scrollToElem(post.Id);
        }
        else
            showError("Une erreur est survenue! ", Posts_API.currentHttpError);
    });
    $('#cancel').on("click", async function () {
        await showPosts();
    });
}
function getFormData($form) {
    // prevent html injections
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    // grab data from all controls
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}