<script>
    import { goto } from '$app/navigation';   
    
    let email = $state('');
    let password = $state('');

    // ToDo: Hier später die Login-Funktionen implementieren!

</script>

<h1>Login</h1>

<form>
    <label for="email">E-Mail: </label>
    <input
        id="email"
        type="email"
        bind:value={email}
        required
    />

    <br>

    <label for="password">Passwort: </label>
    <input
        id="password"
        type="password"
        bind:value={password}
        required
    />

    <br>

    <button type="submit">Login</button>

    <br>
    <br>

    <!--Achtung: Den "Produktionsbutton" bei erfolgreicher Login-Implementierung wieder entfernen!!! -->

    <button type="button" onclick={() => goto('/dashboard')}>
        Only for Devs: Skip Login
    </button>
</form>

<style>
	
    /* ToDo: Hier später das Login-Formular per CSS aufhübschen! */

</style>