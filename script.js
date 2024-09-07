// Función para iniciar el mapa Leaflet
function iniciarMap() {
    var map = L.map('contenedor-mapa').setView([21.126, -101.68], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Manejar clics en el mapa para obtener dirección
    map.on('click', function(e) {
        var latlng = e.latlng;
        var url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + latlng.lat + '&lon=' + latlng.lng;

        fetch(url)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                var address = data.address;
                var street = address.road || address.street || 'No se encontró la calle';
                var number = address.house_number || 'S/N';

                console.log('Calle: ' + street);
                console.log('Número: ' + number);

                // Actualizar valores en el formulario
                document.getElementById('calle').value = street;
                document.getElementById('num_ext').value = number;
            })
            .catch(function(error) {
                console.log('Error al obtener información de ubicación: ' + error.message);
            });
    });

    return map;
}

// Función para manejar la selección de capas
function setupLayerSelect(map) {
    var layerSelect = document.getElementById('layer-select');
    var currentLayer = null;

    layerSelect.addEventListener('change', function(event) {
        var selectedOption = event.target.value;

        if (currentLayer) {
            map.removeLayer(currentLayer);
            currentLayer = null;
        }

        if (selectedOption !== 'none') {
            var scriptUrl = 'data/' + selectedOption + '.js';
            var script = document.createElement('script');
            script.src = scriptUrl;
            script.type = 'text/javascript';
            document.body.appendChild(script);

            script.onload = function() {
                if (typeof geoJsonData !== 'undefined') {
                    currentLayer = L.geoJSON(geoJsonData).addTo(map);
                } else {
                    console.error('No se encontró geoJsonData en el archivo ' + scriptUrl);
                }
            };

            script.onerror = function() {
                console.error('Error al cargar el archivo ' + scriptUrl);
            };
        }
    });
}

// Función para manejar la generación de formularios y PDF
function formularioYGenPDF() {
    const generateFormButton = document.getElementById('generate-form');
    const extraFormContainer = document.getElementById('extra-form-container');
    const generatePdfButton = document.getElementById('generate-pdf');
    const modalidadTramiteSelect = document.getElementById('modalidad_tramite');
    const modal = document.getElementById('myModal');
    const closeModalButton = document.querySelector('.close');

    generateFormButton.addEventListener('click', () => {
        const modalidadTramite = modalidadTramiteSelect.value;

        // Limpiar cualquier formulario adicional previo
        extraFormContainer.innerHTML = '';

        // Crear formulario adicional según tipo y modalidad
        if (modalidadTramite === 'uso_info') {
            extraFormContainer.innerHTML = `
                <div>
                </div>
            `;
        } else if (modalidadTramite === 'uso_fac') {
            extraFormContainer.innerHTML = `
                <div>
                    <label for="extra_field2">Giro:</label>
                    <select id="giro_solicitado" name="giro_solicitado">
                        <option value="giro_gasolinera">Gasolinera</option>
                        <option value="giro_papeleria">Papelería</option>
                        <option value="giro_tienda">Tienda Autoservicio</option>
                        <option value="giro_banco">Banco</option>
                        <option value="giro_bar">Bar</option>
                        <option value="giro_restaurante">Restaurante</option>
                    </select>
                </div>
            `;
        }

        // Mostrar el modal
        modal.style.display = 'block';
    });

    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    generatePdfButton.addEventListener('click', () => {
        const formData = new FormData(document.getElementById('data-form'));
        const allData = {};

        // Recoger datos del formulario principal
        formData.forEach((value, key) => allData[key] = value);

        // Recoger datos del formulario adicional
        const extraFields = extraFormContainer.querySelectorAll('input, select');
        extraFields.forEach(field => {
            allData[field.name] = field.value;
        });

        // Llamar a generatePDF pasando los datos recolectados
        generatePDF(allData);
    });

    function generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        // Título principal
        doc.setFontSize(16);
        doc.text("Detalles del Predio", 10, 15);
    
        // Logo y fecha de expedición
        doc.addImage('img/logoLeon.png', 'PNG', 150, 10, 50, 25);
        const fechaExpedicion = formatDate(new Date());
        doc.setFontSize(10);
        doc.text(`FECHA DE EXPEDICIÓN: ${fechaExpedicion}`, 10, 45);
    
        let verticalOffset = 55; // Inicio del contenido principal
    
        // Texto principal
        const textoPrincipal = `En alcance de las atribuciones conferidas a esta Dirección General de Desarrollo Urbano en el artículo 156 fracciones I, II inciso d), IV y XVII y artículo 137 fracciones I, III y XVI del Reglamento Interior de la Administración Pública Municipal de León Guanajuato y 13 fracción XIX del Código Reglamentario de Desarrollo Urbano para el Municipio de León, Guanajuato, y atendiendo a su derecho contenido dentro del artículo 8º párrafo segundo de la Constitución Política de los Estados Unidos Mexicanos y en respuesta la consulta realizada en el sistema de Información Urbana, con base en los datos ingresados por el solicitante y mediante lo establecido en la tabla 1 de compatibilidades que forma parte integral del Código Reglamentario de Desarrollo Urbano para el Municipio de León, Guanajuato, se hace de su conocimiento lo siguiente:`;
    
        // Texto adicional según modalidad
        const modalidad = data.modalidad_tramite;
        let textoModalidad = '';
        if (modalidad === 'uso_info') {
            textoModalidad = "PDF para Uso Informativo\nEste es un ejemplo de texto para Uso Informativo.";
        } else if (modalidad === 'uso_fac') {
            textoModalidad = "PDF para Uso Factible\nEste es un ejemplo de texto para Uso Factible.";
        }
    
        // Datos generales del predio
        const datosGenerales = [
            `Expendio de Combustible`,
            `DATOS GENERALES`,
            `Superficie total del predio: ${data.superficie_total} M2`,
            `Superficie a ocupar del predio: ${data.superficie_construida} M2`,
            `Calle: ${data.calle}`,
            `Corredor y/o Zona: ${data.nombre_sect}`,
            `COS: ${data.cos}`,
            `Tipo de Vialidad: ${data.tipo_vialidad}`,
            `Niveles Permitidos: ${data.niveles_permitidos}`,
            `Cajones de estacionamiento: ${data.cajones_estacionamiento || 'Ninguno'}`
        ];
    
        // Sobre el giro solicitado
        const giroSolicitado = `SOBRE EL GIRO SOLICITADO\nEl predio cuenta con una dimensión de ${data.superficie_total} metros cuadrados. El uso solicitado "${data.giro_solicitado}" se encuentra clasificado dentro del grupo de compatibilidad de uso industrial y de servicios con clave 4.04.05 en el sistema del Registro Estatal de Trámites y Servicios Urbanos (RETYS).`;
    
        // Validación de uso
        const usoValido = `El giro solicitado es válido para el uso de suelo.`;
    
        const textos = [
            textoPrincipal,
            textoModalidad,
            datosGenerales.join('\n'),
            giroSolicitado,
            usoValido
        ];

        if (modalidad === 'uso_fac') {
            textos.push(`Giro Solicitado: ${data.giro_solicitado}`);
        }
    
        textos.forEach(texto => {
            doc.setFontSize(12);
            const lines = doc.splitTextToSize(texto, 180);
            doc.text(lines, 10, verticalOffset);
            verticalOffset += lines.length * 10;
            verticalOffset += 3; // Espacio adicional entre bloques de texto
        });
    
        // Guardar el PDF
        doc.save('Detalles_Predio.pdf');
    }

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// Función para manejar el filtro de búsqueda
function filtroBusqueda() {
    var filterButton = document.getElementById('filter-button');
    filterButton.addEventListener('click', function() {
        var filtro = document.getElementById('filtro');
        filtro.classList.toggle('hidden');
    });
}

// Función principal para inicializar
function initialize() {
    const map = iniciarMap();
    filtroBusqueda();
    setupLayerSelect(map);
    formularioYGenPDF();
}

document.addEventListener("DOMContentLoaded", initialize);

// Funciones para abrir y cerrar el modal
var modal = document.getElementById('myModal');
var closeButton = document.getElementsByClassName('close')[0];

function abrirModal() {
    modal.style.display = 'block';
}

function cerrarModal() {
    modal.style.display = 'none';
}

closeButton.onclick = function() {
    cerrarModal();
}

// Función para manejar clic en botones del grupo
function handleButtonClick(group, selectedId) {
    const buttons = document.querySelectorAll(`#${group} .btn-option`);
    buttons.forEach(button => {
        if (button.id === selectedId) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }
    });
}

// Eventos para los botones de vialidad cerrada
document.getElementById("vialidad_cerrada_si").addEventListener("click", function() {
    vialidadCerrada = this.getAttribute("data-value");
    document.getElementById("vialidad_cerrada").value = vialidadCerrada;
    handleButtonClick("vialidad-cerrada-group", "vialidad_cerrada_si");
});
document.getElementById("vialidad_cerrada_no").addEventListener("click", function() {
    vialidadCerrada = this.getAttribute("data-value");
    document.getElementById("vialidad_cerrada").value = vialidadCerrada;
    handleButtonClick("vialidad-cerrada-group", "vialidad_cerrada_no");
});


document.addEventListener('DOMContentLoaded', function () {
    // Ruta al archivo PDF existente
    const pdfFilePath = 'img/202307191213190.230713 Código Reglamentario de Desarrollo Urbano 2023.pdf'; // Cambia esto a la ruta correcta de tu archivo PDF

    // Función para crear el botón de descarga
    function crearBotonDescarga() {
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfFilePath;
        downloadLink.download = 'Codigo Reglamentario de Desarrollo Urbano.pdf';
        downloadLink.textContent = 'Descargar PDF';
        downloadLink.classList.add('btn-option');

        // Añade el enlace de descarga al contenedor
        const pdfDownloadContainer = document.getElementById('pdf-download-container');
        pdfDownloadContainer.innerHTML = ''; // Limpiar cualquier enlace previo
        pdfDownloadContainer.appendChild(downloadLink);
    }

    // Asigna el evento de clic al botón de generación de PDF
    document.getElementById('generate-codreg').addEventListener('click', crearBotonDescarga);
});
