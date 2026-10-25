<div id="center">

    <h1>Registrieren</h1>

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

        <label for="repetition">Passwort: </label>

        <br>

        <input
                id="repetition"
                name="repetition"
                type="password"
                required
        />

        <br>
        <br>

        <button type="submit">Registrieren</button>
    </form>

</div>

<style>

    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;500;600&display=swap');

    :root {
        --background: #f7f5f3;
        --surface: #ffffff;
        --primary: #1f1f1f;
        --secondary: #5a5a5a;
        --accent: #A51C30;
        --accent-dark: #7E1525;
        --accent-light: #C74A5C;
        --border: #d8d3cf;
        --card-bg: #ffffff;
        --shadow: 0 8px 24px rgba(0, 0, 0, .08);
        --radius: 16px;
        --max-width: 1200px;
    }

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

    #repetition {

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
