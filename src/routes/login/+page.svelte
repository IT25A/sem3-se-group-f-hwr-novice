<script>
    import { goto } from '$app/navigation';
</script>

<h1>Login</h1>

<form method="POST">
    <label for="username">E-Mail: </label>
    <input
        id="username"
        name="username"
        type="text"
        required
    />

    <br>

    <label for="password">Passwort: </label>
    <input
        id="password"
        name="password"
        type="password"
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