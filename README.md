# Welcome to your Expo app 👋

## Inicio de sesión con Google

1. Configura `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY` con la URL y
   la clave publicable (anon) del proyecto de Supabase. Nunca uses la clave
   `service_role` en la aplicación.
2. Aplica en Supabase el SQL de autenticación de los avistamientos: la columna
   `usuario_id`, su valor predeterminado y las políticas de inserción para
   usuarios autenticados y para el bucket `poliperrodex`.
3. En Google Cloud crea un cliente OAuth de tipo aplicación web y registra la
   URL de callback de Supabase (`https://<proyecto>.supabase.co/auth/v1/callback`)
   como URI de redirección autorizada. Activa Google en Supabase Auth y configura
   allí el ID y el secreto de ese cliente, no en la aplicación.
4. En Supabase Auth > URL Configuration añade `poliperrodex://` a las URLs de
   redirección. Para web añade también la URL de origen de la aplicación (por
   ejemplo `http://localhost:8081/`). Expo Go usa una URL `exp://` dependiente
   del servidor; añádela para probar o utiliza una development build con el
   esquema estable `poliperrodex://`.
5. Verifica que las políticas `SELECT` de `avistamientos` permitan a `anon` y
   `authenticated` leer **todas** las filas, y que el bucket sea público para
   lectura. El SQL de inserción no crea políticas de lectura. Revisa también que
   no haya políticas permisivas `FOR ALL` que permitan a `authenticated` insertar
   filas con otro `usuario_id`: las políticas permisivas se combinan con OR.

La app consulta los perros y avistamientos públicos con la clave anónima,
incluso después de iniciar sesión. Las fotos y los nuevos avistamientos se
guardan con la sesión autenticada.

El apodo sigue siendo un nombre visible local, no una identidad. Las capturas
propias se identifican por `usuario_id`; las filas antiguas con `usuario_id`
vacío siguen visibles para todos, pero no se asignan automáticamente a ninguna
cuenta. La foto se muestra para confirmarla o repetirla antes de guardar.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
