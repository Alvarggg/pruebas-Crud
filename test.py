from playwright.sync_api import sync_playwright

def run_tests():
    with sync_playwright() as p:
        # Lanzar el navegador en modo no headless para ver las pruebas
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Cargar la página de inicio de sesión
        page.goto("http://localhost:3000/login")  # Reemplaza con la URL de tu aplicación

        # Prueba 1: Verificar que el título de la página es correcto
        print("Título actual:", page.title())
        assert page.title() == "Arminton"
        print("Prueba 1: Título de la página verificado")

       
        # Prueba 3: Intentar iniciar sesión con credenciales incorrectas
        page.goto("http://localhost:3000/login")
        page.fill("input[name='username']", "usuarioInvalido")
        page.fill("input[name='password']", "contraseñaIncorrecta")
        page.click("button[type='submit']")

        # Verificar que el mensaje de error aparece
        assert page.text_content(".error") == "Usuario o contraseña incorrectos."
        print("Prueba 3: Manejo de error de credenciales incorrectas verificado")

         # Prueba 2: Iniciar sesión con credenciales correctas
        page.fill("input[name='username']", "a")
        page.fill("input[name='password']", "a")
        page.click("button[type='submit']")

        # Verificar que se redirige correctamente (puede ser mediante un mensaje o URL)
        assert page.url == "http://localhost:3000/characters"  # Reemplaza con la URL esperada
        print("Prueba 2: Inicio de sesión con credenciales válidas exitoso")
        page.click("a.create-button")

        # Verificar si la URL redirigió a la página de creación de un nuevo perfil
        assert page.url == "http://localhost:3000/characters/new"  # Ajusta la URL según tu aplicación
        print("Prueba de clic en 'Crear nuevo perfil' exitosa")

        page.fill("input[name='name']", "AK-47")
        page.fill("input[name='energyLevel']", "30")
        page.fill("input[name='lifeExpectancy']", "100")
        page.select_option("select[name='tipoArma']", "Metralleta")
        page.click("button[type='submit']")

        # Verificar que se redirige o se muestra un mensaje de éxito (dependiendo de tu aplicación)
        # Puedes usar la URL de redirección o un texto en la página para confirmar.
        assert "Personaje creado exitosamente" in page.content() or page.url == "http://localhost:3000/characters"
        print("Prueba crear: Personaje creado con éxito")


        # Cerrar el navegador
        browser.close()

# Ejecutar las pruebas
run_tests()
