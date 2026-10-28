<div id="center">

    <h1>Einloggen</h1>

    <br>

    <form method="POST">
        <label for="username">Benutzername: </label>

        <br>

        <input
                id="username"
                name="username"
                type="text"
                required
        />

        <br>
        <br>

        <label for="password">Passwort: </label>
        
        <br>
        
        <input
                id="password"
                name="password"
                type="password"
                required
        />

        <br>
        <br>

        <button type="submit">Einloggen</button>
    </form>

</div>


<style>
    #username {

        background: white;

        padding: 10px 18px;

        border-radius: 40px;

        box-shadow: var(--shadow);

        font-size: 1rem;

        font-family: "Inter", sans-serif;
        
        line-height: 1.75;

    }

    #password {

        background: white;

        padding: 10px 18px;

        border-radius: 40px;

        box-shadow: var(--shadow);

        font-size: 1rem;

        font-family: "Inter", sans-serif;
        
        line-height: 1.75;
    }

     h1 {

        font-family: "Cormorant Garamond", serif;
        
        font-size: 4rem;
        
        font-weight: 600;
        
        margin-bottom: .4rem;
    }

    label {

        font-size: 1rem;

        font-family: "Inter", sans-serif;
        
        line-height: 1.75;
    
    }

    button {

        padding: 10px 10px 10px 10px;

        border-radius: 40px;

        font-size: 1rem;

        font-family: "Inter", sans-serif;
        
        line-height: 1.75;

    }

    #center {
        
        justify-content: center;
        
        align-items: center;
        
        text-align: center;

        padding: 120px 50px;

    }

</style>