Coffee Flower ☕🌸
Plataforma web para una cafetería y pastelería que integra una interfaz de usuario, un backend BFF y funciones serverless para gestionar la experiencia de la tienda, procesar notificaciones de pedidos y preparar informes de ventas.

Este README reúne la documentación de los tres componentes descritos: Frontend, Backend BFF y Coffee Flower Lambda. Los estados de implementación se indican con cautela cuando los documentos de origen señalan que una integración está pendiente de validación.
Índice
- Descripción general
- Arquitectura
- Componentes del sistema
- Tecnologías
- Flujos principales
- Configuración
- Ejecución local
- Pruebas y validación
- Despliegue
- Seguridad y operación
- Estado y aspectos por validar
- Repositorios
Descripción general
Coffee Flower es una plataforma web para una cafetería y pastelería. Su frontend permite navegar por la página principal, explorar productos y categorías, acceder al carrito y consultar páginas destinadas a colaboradores y gestión. El backend BFF expone endpoints REST y centraliza parte de la lógica de integración con PostgreSQL y Amazon SNS. Las funciones AWS Lambda procesan mensajes de pedidos y solicitudes de reportes mediante colas SQS.

La solución está organizada en tres componentes:
1. Frontend: interfaz web desarrollada con React y TypeScript, preparada para integrarse con APIs y autenticación OpenID Connect.
2. Backend BFF: aplicación Java con Spring Boot que atiende solicitudes del frontend, consulta datos y publica el informe mensual mediante Amazon SNS.
3. Funciones Lambda: procesos serverless para notificaciones de pedidos y solicitudes de informes de ventas, con acceso a PostgreSQL y servicios de AWS.
Arquitectura
                         Usuarios
                            |
                            v
                Frontend Coffee Flower
                  React + TypeScript
                     Vercel
                            |
                       HTTPS / REST
                            |
                            v
                 Backend BFF - Spring Boot
                    Docker / AWS EC2
                     /           \
                    v             v
              PostgreSQL       Amazon SNS
              / Supabase           |
                                   v
                          Flujo de mensajería AWS
                               SQS / Lambda
                                   |
                                   v
                         Procesamiento de pedidos
                          y solicitudes de reporte
                                   |
                                   v
                              PostgreSQL
Nota de arquitectura: el diagrama representa los componentes y las relaciones descritos en los README de origen. La integración final entre SNS, SQS y Lambda para procesar y enviar reportes —incluido el formato HTML— está pendiente de validación según la documentación del Backend BFF. El flujo de reportes Lambda también depende de completar src/notifier.js.
Componentes del sistema
1. Frontend
Interfaz web para la cafetería y pastelería.

Páginas documentadas:
Página	Propósito
Home	Página principal.
Productos	Visualización del catálogo.
Categorías	Exploración de categorías disponibles.
Carrito	Interfaz para gestionar productos seleccionados.
Colaborador	Página destinada al colaborador de la cafetería.
Dashboard	Panel para funcionalidades de gestión implementadas.


Tecnologías: React 19, TypeScript, Vite 7, React Router DOM 7, oidc-client-ts, react-oidc-context, HTML5 y CSS3.

La presencia de dependencias OIDC permite implementar autenticación OpenID Connect, pero no garantiza por sí sola que todos los parámetros del proveedor de identidad estén configurados correctamente.
2. Backend BFF
Backend desarrollado con Java 21 y Spring Boot 3.4.4. Actúa como intermediario entre el frontend y los recursos del backend.

Responsabilidades documentadas:
- Exponer endpoints REST para el frontend.
- Gestionar solicitudes relacionadas con pedidos y productos.
- Consultar información en PostgreSQL.
- Calcular el resumen mensual de ventas.
- Publicar el informe mediante Amazon SNS.
Tecnologías: Java 21, Spring Boot 3.4.4, Spring Data JPA, PostgreSQL, Amazon SNS, Docker, GitHub y AWS EC2. El README del backend también identifica una imagen Docker publicada en GitHub Container Registry (GHCR).
3. Funciones AWS Lambda
Funciones Node.js destinadas a procesar eventos de pedidos y solicitudes de informes.
Archivo	Responsabilidad descrita
src/index.js	Procesar mensajes SQS de pedidos y publicar notificaciones mediante SNS.
src/report.handler.js	Recibir solicitudes de reporte y validar eventos report.requested.
src/report.service.js	Validar parámetros, calcular el periodo, consultar datos y construir el texto del informe.
src/product.repository.js	Consultar PostgreSQL para obtener totales de pedidos, unidades y productos más vendidos.
src/notifier.js	Módulo destinado al envío de informes; su implementación debe completarse para ejecutar ese flujo.


Tecnologías: Node.js 20, AWS Lambda, Amazon SQS, Amazon SNS, PostgreSQL, pg y AWS SDK for JavaScript v3.
Tecnologías
Área	Tecnologías documentadas
Frontend	React 19, TypeScript, Vite 7, React Router DOM 7
Autenticación	OIDC Client TS, React OIDC Context
Backend BFF	Java 21, Spring Boot 3.4.4, Spring Data JPA
Persistencia	PostgreSQL / Supabase
Mensajería	Amazon SNS, Amazon SQS
Procesamiento serverless	AWS Lambda, Node.js 20
Contenedores	Docker
Infraestructura	AWS EC2, AWS IAM
CI/CD	GitHub Actions
Frontend publicado	Vercel
Registro de imágenes documentado	GitHub Container Registry (GHCR)
Control de versiones	Git y GitHub


Flujos principales
Flujo de navegación del frontend
1. El usuario accede a la aplicación web.
2. Navega por las páginas disponibles de productos, categorías, carrito, colaborador y dashboard.
3. El frontend puede consumir APIs externas según la configuración de la aplicación.
4. La autenticación depende de la configuración OIDC utilizada en el proyecto.
Flujo de notificación de pedidos con Lambda
Según el README de Lambda:
1. La función recibe un evento con registros de SQS.
2. Analiza el cuerpo JSON y, si corresponde, extrae el mensaje de un envoltorio SNS.
3. Si el evento incluye type y no corresponde a pedido.creado, lo ignora.
4. Construye una notificación con datos del pedido, como identificador, cliente, total, estado, fecha y productos.
5. Publica la notificación en el tema SNS configurado.
6. Devuelve información sobre los registros procesados.
Flujo del informe mensual en el Backend BFF
El servicio InformeComprasService:
1. Calcula el periodo del mes actual con la zona horaria America/Santiago.
2. Consulta los pedidos del periodo.
3. Excluye pedidos con estado CANCELADO o CANCELLED.
4. Calcula la cantidad de pedidos, las unidades vendidas y el total de ventas.
5. Formatea el total en pesos chilenos (CLP).
6. Construye un mensaje de texto plano.
7. Publica el mensaje en Amazon SNS.
8. Devuelve datos del periodo y los totales, además del identificador del mensaje SNS.
El endpoint documentado para este flujo es:
Propiedad	Valor
Método	POST
Ruta	/api/reportes/compras
Puerto local documentado	8080
Función	Generar y publicar el informe mensual


La solicitud de prueba documentada no requiere cuerpo JSON. La respuesta exacta depende del controlador y del servicio desplegado.
Flujo de solicitudes de reporte en Lambda
El servicio de reportes Lambda espera mensajes del tipo report.requested, con campos como requestId, requester, reportType y parámetros opcionales desde y hasta.

El servicio consulta PostgreSQL para calcular el número de pedidos, el total de ventas, las unidades vendidas y hasta diez productos más vendidos. Después construye el informe y llama a notifier.sendReport(report). Este último paso requiere completar y probar el módulo src/notifier.js.

Ejemplo de solicitud documentado:
{
  "type": "report.requested",
  "body": {
    "requestId": "reporte-001",
    "requester": "administracion",
    "reportType": "ventas",
    "params": {
      "desde": "2026-10-01",
      "hasta": "2026-10-28"
    }
  }
}
Las fechas utilizan el formato YYYY-MM-DD. Según el servicio documentado, la fecha hasta se maneja mediante el día siguiente como límite exclusivo en la consulta.
Configuración
Cada componente requiere su propia configuración. Los nombres deben coincidir con los utilizados por el código de cada repositorio.
Frontend
Crear un archivo .env en la raíz del frontend a partir de .env.example y definir las variables necesarias.

Ejemplo de variable para una API:
VITE_API_URL=https://URL_DE_LA_API
Si se utiliza Amazon Cognito mediante OpenID Connect, configurar los valores requeridos por la implementación, como autoridad, identificador de cliente y URL de redirección. No se deben incluir secretos privados en variables VITE_*, porque esas variables pueden quedar expuestas en el código entregado al navegador.
Backend BFF
Configurar las variables de entorno que utilice la aplicación:
Variable	Propósito
DB_URL	URL JDBC de PostgreSQL.
DB_USER	Usuario de PostgreSQL.
DB_PASSWORD	Contraseña de PostgreSQL.
AWS_REGION o APP_AWS_REGION	Región de AWS, según la configuración del proyecto.
AWS_SNS_TOPIC_ARN	ARN del tema SNS del informe.
SNS_TOPIC_ARN	Variable alternativa para el ARN del tema SNS.
FRONTEND_ORIGIN	Origen del frontend permitido por la configuración CORS.
GATEWAY_SECRET	Secreto del gateway, si la aplicación lo requiere.


El servicio del informe busca primero AWS_SNS_TOPIC_ARN y utiliza SNS_TOPIC_ARN como alternativa.
Lambda
Configurar en las funciones Lambda las variables correspondientes:
Variable	Propósito
AWS_REGION	Región de AWS; el código documentado utiliza us-east-1 como valor alternativo.
NOTIFICATION_TOPIC_ARN	ARN del tema SNS para las notificaciones de pedidos.
DATABASE_URL	Cadena de conexión PostgreSQL usada por el módulo de reportes.
DATABASE_SSL	Controla la configuración SSL del cliente PostgreSQL.


En el código documentado, DATABASE_SSL=false desactiva SSL; en otro caso se utiliza SSL con rejectUnauthorized: false. Evalúa la configuración de seguridad adecuada para el entorno antes de usarla en producción.

Seguridad: no guardes contraseñas, tokens, claves AWS, archivos .pem ni archivos .env con valores reales en GitHub.
Ejecución local
Frontend
Requisitos: Node.js y npm.
git clone https://github.com/Barbara-Carolina7/Coffee-Flower-Frontend.git
cd Coffee-Flower-Frontend
npm install
npm run dev
Vite mostrará la dirección local de desarrollo; habitualmente es http://localhost:5173.

Compilar para producción:
npm run build
Vista previa de la compilación:
npm run preview
Backend BFF
Requisitos: JDK 21, acceso a PostgreSQL y configuración AWS para SNS.

Clonar el repositorio:
git clone https://github.com/jesenia1707/back-coffe-flower.git
cd back-coffe-flower
Si el proyecto Spring Boot está dentro de backend, entrar en esa carpeta:
cd backend
Compilar y ejecutar pruebas con Gradle Wrapper:

Windows:
.\gradlew.bat clean build
Linux/macOS:
./gradlew clean build
Iniciar la aplicación:

Windows:
.\gradlew.bat bootRun
Linux/macOS:
./gradlew bootRun
El puerto local documentado para el backend es 8080, salvo que la configuración de Spring indique otro.
Lambda
Requisitos: Node.js 20 y npm.

Desde la raíz del repositorio Lambda:
npm ci
npm test
El script de pruebas documentado ejecuta comprobaciones de sintaxis con node --check. No sustituye las pruebas de integración con AWS o PostgreSQL.
Despliegue
Frontend en Vercel
La aplicación publicada se documenta en:
- Aplicación: https://coffee-flower-frontend.vercel.app/
- Repositorio: https://github.com/Barbara-Carolina7/Coffee-Flower-Frontend
Las nuevas versiones pueden publicarse conectando GitHub con Vercel y configurando las variables de entorno requeridas.
Backend BFF con Docker y EC2
El README del backend documenta esta imagen:
ghcr.io/jesenia1707/back-coffe-flower:latest
Descargarla:
docker pull ghcr.io/jesenia1707/back-coffe-flower:latest
Ejecutar un contenedor utilizando un archivo de variables protegido:
docker run -d \
  --name coffee-flower-bff \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file /ruta/al/archivo.env \
  ghcr.io/jesenia1707/back-coffe-flower:latest
Consultar registros:
docker logs --tail 100 coffee-flower-bff
Antes de desplegar una nueva versión:
1. Compilar y probar localmente.
2. Revisar los cambios y confirmar que no incluyen secretos.
3. Construir y publicar la nueva imagen.
4. Actualizar el contenedor de EC2 conservando la configuración de entorno.
5. Revisar los registros de Spring Boot.
6. Probar los endpoints y el flujo de notificación.
7. Mantener disponible la imagen anterior para poder revertir el despliegue si fuera necesario.
AWS Lambda con GitHub Actions
El repositorio Lambda incluye workflows de despliegue que utilizan autenticación mediante role-to-assume. La configuración documentada requiere el secreto AWS_ROLE_ARN y los nombres de funciones:
- LAMBDA_FUNCTION_NAME: función de notificaciones.
- LAMBDA_REPORT_FUNCTION_NAME: función de reportes.
Los archivos de workflow deben ubicarse en .github/workflows/. El README de origen señala que estaban en .github/worflows/, nombre que GitHub Actions no detecta automáticamente. Corrige la ruta en el repositorio antes de depender del despliegue automatizado.
Pruebas y validación
Validación del informe BFF
Para verificar el informe mensual:
1. Ejecutar POST /api/reportes/compras.
2. Verificar el código de respuesta HTTP y el cuerpo devuelto.
3. Revisar los logs del contenedor.
4. Comprobar la publicación en el tema SNS correcto.
5. Confirmar que la suscripción de correo esté confirmada y que el mensaje llegue.
6. Si se completa la integración con SQS y Lambda, verificar también ese procesamiento y la representación final del correo.
Una respuesta HTTP exitosa no garantiza por sí sola que el correo haya llegado ni que se muestre como HTML.
Validación de Lambda
- Ejecutar npm ci y npm test.
- Probar con un mensaje controlado de SQS.
- Revisar los logs en Amazon CloudWatch.
- Comprobar los permisos IAM y la conectividad con PostgreSQL.
- Verificar que src/notifier.js implemente sendReport(report) antes de probar el flujo completo de reportes.
Validación del frontend
- Ejecutar npm run build.
- Comprobar que las variables de entorno sean correctas.
- Verificar las rutas principales y la comunicación con la API configurada.
- Si se utiliza OIDC, probar el inicio y retorno de sesión con las URL de redirección configuradas.
Seguridad y operación
- Aplicar el principio de mínimo privilegio en los roles IAM.
- No incluir secretos en el código, las imágenes Docker ni los logs.
- Mantener las variables sensibles fuera del control de versiones.
- Restringir el acceso a puertos y endpoints según las necesidades del sistema.
- Revisar los logs de CloudWatch cuando una invocación Lambda falle.
- Configurar reintentos y una cola de mensajes fallidos (DLQ) para SQS cuando corresponda.
- Considerar la idempotencia, ya que SQS puede entregar un mismo mensaje más de una vez.
- Verificar los ARN de SNS y las suscripciones antes de probar en producción.
- Evitar publicar credenciales privadas en variables del frontend o en repositorios públicos.
Estado y aspectos por validar
Según los tres README de origen, deben revisarse los siguientes puntos antes de declarar todos los flujos integrados y terminados:
- Frontend: la configuración OIDC y las funciones de cada página dependen de la implementación vigente.
- Backend BFF: el endpoint documentado publica un mensaje de texto plano mediante SNS. El diseño HTML y su procesamiento final requieren un componente de envío que interprete HTML.
- Historial de informes: los README no documentan como funcionalidad confirmada el guardado de un historial de informes en PostgreSQL.
- Lambda de reportes: src/notifier.js está descrito como vacío y requiere implementar sendReport(report).
- GitHub Actions: la carpeta worflows debe corregirse a workflows.
- Integración entre SNS, SQS y Lambda: la conexión final debe probarse de extremo a extremo.
Estos puntos se incluyen como validaciones pendientes porque así se describen en la documentación recibida; no se asume que estén resueltos sin pruebas.
Repositorios y aplicación
- Frontend: https://github.com/Barbara-Carolina7/Coffee-Flower-Frontend
- Backend BFF: https://github.com/jesenia1707/back-coffe-flower
- Frontend publicado: https://coffee-flower-frontend.vercel.app/
- Repositorio Lambda: el README recibido no especifica una URL pública del repositorio.
Autores
Proyecto académico desarrollado como parte del proceso de formación en Ingeniería en Informática.
Licencia
La licencia debe definirse de acuerdo con las condiciones de uso y distribución establecidas por los autores.
Coffee Flower — Plataforma web de cafetería y pastelería con frontend, backend de integración y procesamiento serverless..
