# Guiones de los videos paso a paso del onboarding (voz "Libia IA").
# Regla: que lo entienda una abuela o un niño. Frases cortas, una idea por frase.
# Los nombres de botones van en inglés porque así salen en la pantalla.
# "inteligencia artificial" completo (con la sigla la voz dice "A-I-A").

def T(titulo, sub=''):          return ('titulo', {'t': titulo, 's': sub})
def P(url, titulo, campos, boton, nota=''):
    return ('pantalla', {'url': url, 't': titulo, 'campos': campos, 'boton': boton, 'nota': nota})
def L(titulo, items):           return ('lista', {'t': titulo, 'items': items})

VIDEOS = {
 '01-cuentas': [
  (T('Tus cuentas', 'Todo queda a tu nombre'),
   'Hola, soy Libia. Vamos a crear tus cuentas. Son tuyas, como tu casa: todo lo que construyamos se queda contigo. Y nunca te voy a pedir una contraseña.'),
  (P('github.com/signup', 'GitHub: la caja de tu app', ['Tu correo', 'Una contraseña', 'Un nombre de usuario'], 'Create account'),
   'La primera es GitHub. Es como una caja fuerte donde se guarda tu app. Pon tu correo, una contraseña y un nombre de usuario. Apunta tu usuario, te lo voy a pedir.'),
  (P('supabase.com/dashboard/sign-up', 'Supabase: tu libreta de datos', [], 'Continue with GitHub'),
   'La segunda es Supabase. Es como una libreta donde se anotan todos tus clientes. Solo dale clic al botón que dice Continue with GitHub.'),
  (P('vercel.com/signup', 'Vercel: donde se ve tu app', [], 'Continue with GitHub'),
   'La tercera es Vercel. Es lo que hace que tu app se pueda abrir desde cualquier lado. Igual, clic en Continue with GitHub.'),
  (P('zernio.com', 'Zernio: todos tus mensajes juntos', ['Tu correo', 'Una contraseña'], 'Sign up'),
   'La cuarta es Zernio. Ahí llegan juntos tus mensajes de WhatsApp, Instagram y Facebook.'),
  (L('Tu ayudante', ['Claude (pestaña Code)', 'o Codex', 'Usa tu suscripción']),
   'Y al final, instala a tu ayudante de inteligencia artificial: Claude o Codex. Es como un asistente que entiende tu negocio. Cada vez que crees una cuenta, palomeala en la lista.'),
 ],
 '02-acceso': [
  (T('Dame permiso', 'Sin contraseñas. Me lo quitas cuando quieras.'),
   'Ahora me vas a dar permiso para construir tu sistema. Es como darle una llave a quien te arregla la casa: la casa sigue siendo tuya y la llave me la quitas cuando quieras.'),
  (P('github.com/new', 'Crea tu caja vacía', ['Nombre: mi-sistema', '◉ Private'], 'Create repository'),
   'Primero, en GitHub, entra a github punto com diagonal new. Ponle de nombre mi sistema, con un guion en medio. Marca Private, que quiere decir privado. Y dale Create repository. Déjalo vacío, yo lo lleno.'),
  (P('github.com/…/mi-sistema/settings/access', 'Agrégame', ['Settings → Collaborators', 'Add people: LibiaZarate'], 'Add'),
   'Segundo, ahí mismo entra a Settings, luego a Collaborators, y en Add people escribe Libia Zarate, todo junto. Dale Add.'),
  (P('supabase.com/dashboard', 'Invítame a tu libreta', ['Team → Invite member', 'libiagzarate@gmail.com', 'Administrator'], 'Send invitation'),
   'Tercero, en Supabase entra a Team y dale Invite member. Pega mi correo, que está en la página con un botón para copiarlo, y elige Administrator.'),
  (L('Último paso', ['Escribe tu usuario de GitHub', 'Revisa que diga mi-sistema', 'Dale siguiente']),
   'Al final escribe tu usuario de GitHub en la página y dale siguiente. Listo.'),
 ],
 '03-zernio': [
  (T('Conecta tus mensajes', 'Tu ayudante aprende a leerlos'),
   'Ahora vamos a presentarle Zernio a tu ayudante, para que pueda leer y ordenar tus mensajes.'),
  (L('En tu Claude o Codex', ['Abre un chat nuevo', 'Entra a zernio.com/agents', 'Sigue «Set up Zernio»']),
   'Abre un chat nuevo en tu Claude o tu Codex. Luego entra a zernio punto com diagonal agents. Ahí dice Set up Zernio: sigue lo que dice, y copia y pega lo que te pida.'),
  (P('Tu chat', 'Pruébalo', ['Tú: ¿qué cuentas tengo en Zernio?'], 'Enviar'),
   'Para probar, pregúntale: qué cuentas tengo en Zernio. Si te contesta con tus cuentas, ya quedó.'),
  (L('Si te pierdes', ['Escribe: «esto lo vemos con Libia»', 'y sigue adelante']),
   'Si algo no lo entiendes, no pasa nada. Escribe: esto lo vemos con Libia. Y seguimos juntos en la llamada.'),
 ],
 '04-whatsapp': [
  (T('Conecta tu WhatsApp', 'Tu teléfono sigue funcionando igual'),
   'Ahora tu WhatsApp. No te preocupes: tu teléfono sigue funcionando igual que siempre.'),
  (L('En Zernio', ['Conectar cuenta → WhatsApp', 'Entra con tu Facebook', 'Elige tu número', 'Escanea el código con tu teléfono']),
   'En Zernio dale a conectar cuenta y elige WhatsApp. Entra con tu Facebook y elige tu número. Va a salir un código cuadrito. Ábrelo desde WhatsApp Business en tu teléfono y apúntale con la cámara. Tiene que ser WhatsApp Business, el de la maletita.'),
  (L('¿Mejor juntos?', ['Dale «Lo conectamos en llamada»']),
   'Si prefieres hacerlo conmigo, dale al botón que dice lo conectamos en llamada, y lo hacemos juntos.'),
 ],
 '05-publicar': [
  (T('Abre tu sistema', 'Cuando te avisemos que está listo'),
   'Cuando te avisemos que tu sistema está listo, son tres clics para verlo.'),
  (P('vercel.com/new', 'Publícalo', ['mi-sistema'], 'Import → Deploy'),
   'Uno: entra a vercel punto com diagonal new. Elige mi sistema, dale Import y luego Deploy. Espera un minutito.'),
  (P('vercel.com/…/integrations', 'Únelo con tu libreta', ['Integrations → Supabase'], 'Connect'),
   'Dos: dentro de Vercel entra a Integrations, elige Supabase y dale Connect. Así tu app y tu libreta de datos quedan unidas.'),
  (P('Tu Claude o Codex', 'Platica con tu ayudante', ['Lee CLAUDE.md y explícame mi sistema'], 'Enviar'),
   'Tres: abre tu ayudante y pídele que te explique tu sistema. Desde ahí te puede decir a quién contestar hoy y cómo va tu meta. Ya es tuyo.'),
 ],
}
