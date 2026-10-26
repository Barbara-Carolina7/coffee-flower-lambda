
# Coffee Flower Lambda

Función AWS Lambda que procesa pedidos recibidos desde SQS y publica notificaciones en un tema SNS.

## Variables de entorno

- `AWS_REGION`: región AWS, por ejemplo `us-east-1`.
- `NOTIFICATION_TOPIC_ARN`: ARN del tema SNS exclusivo de Coffee Flower.

## Flujo

Spring Boot guarda el pedido en PostgreSQL y publica el evento `pedido.creado`.
SNS entrega el evento a SQS.
SQS invoca la Lambda.
La Lambda publica la notificación en SNS para el correo del administrador.
