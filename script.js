document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const cleanDataButton = document.getElementById("cleanData");
  const exportDataButton = document.getElementById("exportData");
  const clearDataButton = document.getElementById("clearData");
  const removeDuplicatesCheckbox = document.getElementById("removeDuplicates");
  const handleMissingValuesCheckbox = document.getElementById(
    "handleMissingValues"
  );
  const missingValuesMethodSelect = document.getElementById(
    "missingValuesMethod"
  );
  const correctDateFormatsCheckbox =
    document.getElementById("correctDateFormats");
  const dateFormatInput = document.getElementById("dateFormat");
  const deleteOutliersCheckbox = document.getElementById("deleteOutliers");
  const convertDataTypesCheckbox = document.getElementById("convertDataTypes");
  const standardizeCapitalizationCheckbox = document.getElementById(
    "standardizeCapitalization"
  );
  const ensureStructuralConsistencyCheckbox = document.getElementById(
    "ensureStructuralConsistency"
  );

  let originalData = [];
  let cleanedData = [];

  // Function to read the file
  const readFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = readFileContent(file.name, event.target.result);
      originalData = data;
      displayOriginalData(originalData);
    };
    if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const readFileContent = (fileName, content) => {
    if (fileName.endsWith(".csv")) {
      const data = Papa.parse(content, { header: true });
      return data.data;
    } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
      const workbook = XLSX.read(content, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      const data = Papa.parse(csv, { header: true });
      return data.data;
    }
  };

  // Function to display original data
  const displayOriginalData = (data) => {
    const originalDataTable = document.getElementById("originalDataTable");
    originalDataTable.innerHTML = generateTableHTML(data);
  };

  // Function to generate table HTML
  const generateTableHTML = (data) => {
    const headers = Object.keys(data[0]);
    let tableHTML = "<table><thead><tr>";
    headers.forEach((header) => {
      tableHTML += `<th>${header}</th>`;
    });
    tableHTML += "</tr></thead><tbody>";
    data.forEach((row) => {
      tableHTML += "<tr>";
      headers.forEach((header) => {
        tableHTML += `<td>${row[header] || ""}</td>`;
      });
      tableHTML += "</tr>";
    });
    tableHTML += "</tbody></table>";
    return tableHTML;
  };

  // Function to clean data
  const cleanData = () => {
    let changesLog = [];
    cleanedData = _.cloneDeep(originalData);

    if (removeDuplicatesCheckbox.checked) {
      const initialLength = cleanedData.length;
      cleanedData = _.uniqWith(cleanedData, _.isEqual);
      const duplicatesRemoved = initialLength - cleanedData.length;
      changesLog.push(`Removed duplicates: ${duplicatesRemoved}`);
    }

    if (handleMissingValuesCheckbox.checked) {
      let handledCount = 0;
      if (missingValuesMethodSelect.value === "remove") {
        const initialLength = cleanedData.length;
        cleanedData = cleanedData.filter((row) => {
          const hasMissing =
            Object.values(row).includes(null) ||
            Object.values(row).includes("");
          if (hasMissing) handledCount++;
          return !hasMissing;
        });
        changesLog.push(
          `Handled missing values (removed rows): ${handledCount}`
        );
      } else if (missingValuesMethodSelect.value === "fill") {
        cleanedData = cleanedData.map((row) => {
          Object.keys(row).forEach((key) => {
            if (row[key] === null || row[key] === "") {
              row[key] = "N/A";
              handledCount++;
            }
          });
          return row;
        });
        changesLog.push(`Handled missing values (filled): ${handledCount}`);
      }
    }

    if (correctDateFormatsCheckbox.checked) {
      let correctedCount = 0;
      const dateFormat = dateFormatInput.value;
      cleanedData = cleanedData.map((row) => {
        Object.keys(row).forEach((key) => {
          if (Date.parse(row[key])) {
            row[key] = new Date(row[key])
              .toISOString()
              .slice(0, dateFormat.length);
            correctedCount++;
          }
        });
        return row;
      });
      changesLog.push(`Corrected date formats: ${correctedCount}`);
    }

    if (deleteOutliersCheckbox.checked) {
      // Implement outlier detection and removal logic
      // changesLog.push(`Deleted outliers: ${outliersRemovedCount}`);
    }

    if (convertDataTypesCheckbox.checked) {
      let convertedCount = 0;
      cleanedData = cleanedData.map((row) => {
        Object.keys(row).forEach((key) => {
          if (!isNaN(row[key])) {
            row[key] = parseFloat(row[key]);
            convertedCount++;
          }
        });
        return row;
      });
      changesLog.push(`Converted data types: ${convertedCount}`);
    }

    if (standardizeCapitalizationCheckbox.checked) {
      let standardizedCount = 0;
      cleanedData = cleanedData.map((row) => {
        Object.keys(row).forEach((key) => {
          if (typeof row[key] === "string") {
            row[key] = row[key].toLowerCase();
            standardizedCount++;
          }
        });
        return row;
      });
      changesLog.push(`Standardized capitalization: ${standardizedCount}`);
    }

    if (ensureStructuralConsistencyCheckbox.checked) {
      // Implement structural consistency logic
      // changesLog.push(`Ensured structural consistency: ${consistencyChangesCount}`);
    }

    displayCleanedData(cleanedData);
    logCleanedDataActions(changesLog);
  };

  // Function to display cleaned data
  const displayCleanedData = (data) => {
    const updatedDataTable = document.getElementById("updatedDataTable");
    updatedDataTable.innerHTML = generateTableHTML(data);
  };

  // Function to log cleaned data actions
  const logCleanedDataActions = (changesLog) => {
    const logContainer = document.getElementById("log");
    logContainer.innerHTML = "<h3>Data Cleaning Actions:</h3>";
    changesLog.forEach((log) => {
      logContainer.innerHTML += `<p>${log}</p>`;
    });
  };

  // Function to export cleaned data
  const exportData = () => {
    const csv = Papa.unparse(cleanedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cleaned_data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to clear data
  const clearData = () => {
    originalData = [];
    cleanedData = [];
    document.getElementById("originalDataTable").innerHTML = "";
    document.getElementById("updatedDataTable").innerHTML = "";
    document.getElementById("log").innerHTML = "";
    fileInput.value = "";
  };

  // Event listeners
  fileInput.addEventListener("change", (event) => {
    readFile(event.target.files[0]);
  });

  cleanDataButton.addEventListener("click", cleanData);
  exportDataButton.addEventListener("click", exportData);
  clearDataButton.addEventListener("click", clearData);
});
