class Account {

    static get() {
        let data = sessionStorage.getItem("account");
        if (data == null) return null;

        return JSON.parse(data);
    }

    static token() {
        let data = sessionStorage.getItem("token");
        if (data == null) return null;

        return JSON.parse(data);
    }

    static set(data) {
        sessionStorage.setItem("account", JSON.stringify(data.User));
        sessionStorage.setItem("token", JSON.stringify(data.Access_token));
    }

    static async modify(data) {
        let account = Account.get();
        for (let key in data) {
            account[key] = data[key];
        }

        return await $.ajax({
            url: "/Account/modify",
            type: "POST",
            contentType: 'application/json',
            data: JSON.stringify(account),
            success: (data) => { 
                Account.set(account);
                return true;
            },
            error: () => { return false; }
        });
    }

    static async login(email, password) {
        await $.ajax({
            url: "/token",
            type: "POST",
            contentType: 'application/json',
            data: JSON.stringify({ Email: email, Password: password  }),
            success: (data) => { Account.set(data); }
        });
    }

    static async register(email, password, name) {
        await $.ajax({
            url: "/Account/register",
            type: "POST",
            contentType: 'application/json',
            data: JSON.stringify({ Email: email, Password: password, Name: name }),
            success: (data) => { Account.set(data); }
        });
    }
}