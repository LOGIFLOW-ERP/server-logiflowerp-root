export class BaseException extends Error {
    type: string;
    statusCode: number;
    errorMessage: string;
    messageLogiflow: string | undefined;

    constructor(type: string, statusCode: number, message: string, messageLogiflow: boolean) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.errorMessage = message
        this.messageLogiflow = messageLogiflow ? message : undefined
    }
}

// 🚨 400 - Petición incorrecta (Ejemplo: Dirección de entrega no válida)
/* Ejemplo de uso: */
// if (!deliveryAddress || deliveryAddress.length < 5) {
//     throw new BadRequestException('La dirección de entrega no es válida');
// }
export class BadRequestException extends BaseException {
    constructor(message: string = 'Bad Request', messageLogiflow: boolean = false) {
        super('BadRequest', 400, message, messageLogiflow);
    }
}

// 🔒 401 - No autenticado (Ejemplo: Usuario no ha iniciado sesión)
/* Ejemplo de uso: */
// if (!authToken) {
//     throw new UnauthorizedException('Debes iniciar sesión para continuar');
// }
export class UnauthorizedException extends BaseException {
    constructor(message: string = 'Unauthorized', messageLogiflow: boolean = false) {
        super('Unauthorized', 401, message, messageLogiflow);
    }
}

// 🚫 403 - No autorizado (Ejemplo: Transportista intenta acceder a datos administrativos)
/* Ejemplo de uso: */
// if (user.role !== 'admin') {
//     throw new ForbiddenException('No tienes permisos para ver esta información');
// }
export class ForbiddenException extends BaseException {
    constructor(message: string = 'Forbidden', messageLogiflow: boolean = false) {
        super('Forbidden', 403, message, messageLogiflow);
    }
}

// ❌ 404 - No encontrado (Ejemplo: Pedido no existe)
/* Ejemplo de uso: */
// const order = await OrderRepository.findById(orderId);
// if (!order) {
//     throw new NotFoundException(`No se encontró el pedido con ID: ${orderId}`);
// }
export class NotFoundException extends BaseException {
    constructor(message: string = 'Not Found', messageLogiflow: boolean = false) {
        super('NotFound', 404, message, messageLogiflow);
    }
}

// ⚠️ 409 - Conflicto (Ejemplo: Intentar programar un envío en una fecha ya ocupada)
/* Ejemplo de uso: */
// const existingShipment = await ShipmentRepository.findByDateAndTruck(date, truckId);
// if (existingShipment) {
//     throw new ConflictException('El camión ya tiene un envío programado para esta fecha');
// }
export class ConflictException extends BaseException {
    constructor(message: string = 'Conflict', messageLogiflow: boolean = false) {
        super('Conflict', 409, message, messageLogiflow);
    }
}

// 🛑 422 - Entidad no procesable (Ejemplo: Producto con peso negativo)
/* Ejemplo de uso: */
// if (product.weight < 0) {
//     throw new UnprocessableEntityException('El peso del producto no puede ser negativo');
// }
export class UnprocessableEntityException extends BaseException {
    constructor(message: string = 'Unprocessable Entity', messageLogiflow: boolean = false) {
        super('UnprocessableEntity', 422, message, messageLogiflow);
    }
}

// ⏳ 429 - Demasiadas solicitudes (Ejemplo: Usuario consulta el estado del pedido demasiadas veces)
/* Ejemplo de uso: */
// if (userRequestsInLastMinute > 10) {
//     throw new TooManyRequestsException('Demasiadas solicitudes, intenta más tarde');
// }
export class TooManyRequestsException extends BaseException {
    constructor(message: string = 'Too Many Requests', messageLogiflow: boolean = false) {
        super('TooManyRequests', 429, message, messageLogiflow);
    }
}

// ⚙️ 500 - Error interno (Ejemplo: Fallo en la base de datos al procesar un pedido)
/* Ejemplo de uso: */
// try {
//     await OrderRepository.save(order);
// } catch (error) {
//     throw new InternalServerException('Error al guardar el pedido en la base de datos');
// }
export class InternalServerException extends BaseException {
    constructor(message: string = 'Internal Server Error', messageLogiflow: boolean = false) {
        super('InternalServerError', 500, message, messageLogiflow);
    }
}

// 🔧 503 - Servicio no disponible (Ejemplo: API de terceros caída)
/* Ejemplo de uso: */
// const trackingServiceResponse = await fetch('https://tracking-api.com/status');
// if (!trackingServiceResponse.ok) {
//     throw new ServiceUnavailableException('El servicio de rastreo no está disponible actualmente');
// }
export class ServiceUnavailableException extends BaseException {
    constructor(message: string = 'Service Unavailable', messageLogiflow: boolean = false) {
        super('ServiceUnavailable', 503, message, messageLogiflow);
    }
}
