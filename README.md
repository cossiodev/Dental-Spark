# Dental Spark - Sistema de Gestión de Clínicas Dentales

Un sistema completo de gestión para clínicas dentales que permite administrar pacientes, citas, tratamientos, inventario, odontogramas y facturación.

## 🚀 Características

- **Dashboard**: Visualización completa de la actividad de la clínica
- **Pacientes**: Gestión completa de historiales clínicos
- **Citas**: Programación y seguimiento de citas
- **Tratamientos**: Registro y seguimiento de tratamientos dentales
- **Odontograma**: Registro visual del estado dental de pacientes
- **Inventario**: Control de insumos y materiales
- **Facturación**: Gestión de pagos y facturas
- **Reportes**: Análisis e informes de actividad

## 💻 Tecnologías Utilizadas

- **Frontend**: React, TypeScript, Vite, Shadcn/UI, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Gráficos**: ChartJS
- **Iconos**: Lucide Icons

## 🛠️ Instalación

Sigue estos pasos para configurar el proyecto en tu entorno local:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/dental-spark.git
   cd dental-spark
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura Supabase:
   - Crea una cuenta en [Supabase](https://supabase.com)
   - Crea un nuevo proyecto
   - Ejecuta el script SQL incluido en `SQL_para_Supabase.sql` en la consola SQL de Supabase
   - Copia las credenciales de API de Supabase

4. Configura las variables de entorno:
   - Crea un archivo `.env` basado en `.env.example`
   - Añade tus credenciales de Supabase

5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🔧 Configuración de Base de Datos

Para configurar la base de datos y las políticas de seguridad, ejecuta el script SQL proporcionado en `SQL_para_Supabase.sql`. Este script:

1. Crea todas las tablas necesarias
2. Configura las políticas de Row Level Security (RLS)
3. Establece las relaciones entre tablas
4. Proporciona funciones para la creación de usuarios

## 👥 Roles de Usuario

El sistema admite cuatro tipos de usuarios:

- **Admin**: Acceso completo a todas las funciones
- **Doctor**: Acceso a pacientes, tratamientos y odontogramas
- **Staff**: Acceso a citas, inventario y facturación
- **Paciente**: Acceso limitado a sus propios datos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👏 Contribuciones

Las contribuciones son bienvenidas. Por favor, siente libre de abrir un issue o enviar un pull request.

1. Haz fork del proyecto
2. Crea tu rama de características (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📞 Contacto

Para preguntas o soporte, por favor contacta a [tu-email@example.com](mailto:tu-email@example.com)
