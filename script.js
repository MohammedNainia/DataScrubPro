document.addEventListener("DOMContentLoaded", () => {
  // Existing element references
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
  const customValueInput = document.getElementById("customValueInput");
  const correctDateFormatsCheckbox =
    document.getElementById("correctDateFormats");
  const dateFormatSelect = document.getElementById("dateFormatSelect");
  const deleteOutliersCheckbox = document.getElementById("deleteOutliers");
  const convertDataTypesCheckbox = document.getElementById("convertDataTypes");
  const standardizeCapitalizationCheckbox = document.getElementById(
    "standardizeCapitalization"
  );
  const ensureStructuralConsistencyCheckbox = document.getElementById(
    "ensureStructuralConsistency"
  );
  const mergeDuplicateRowsCheckbox =
    document.getElementById("mergeDuplicateRows");

  // New element references
  const removeUnwantedSpacesCheckbox = document.getElementById(
    "removeUnwantedSpaces"
  );
  const targetColumnSelect = document.getElementById("targetColumnSelect");

  let originalData = [];
  let cleanedData = [];

  missingValuesMethodSelect.addEventListener("change", () => {
    if (missingValuesMethodSelect.value === "fill-custom") {
      customValueInput.style.display = "inline";
    } else {
      customValueInput.style.display = "none";
    }
  });

  removeUnwantedSpacesCheckbox.addEventListener("change", () => {
    if (removeUnwantedSpacesCheckbox.checked) {
      targetColumnSelect.style.display = "inline";
    } else {
      targetColumnSelect.style.display = "none";
    }
  });

  handleMissingValuesCheckbox.addEventListener("change", () => {
    if (handleMissingValuesCheckbox.checked) {
      missingValuesMethodSelect.style.display = "inline";
    } else {
      missingValuesMethodSelect.style.display = "none";
      customValueInput.style.display = "none";
    }
  });

  correctDateFormatsCheckbox.addEventListener("change", () => {
    if (correctDateFormatsCheckbox.checked) {
      dateFormatSelect.style.display = "inline";
    } else {
      dateFormatSelect.style.display = "none";
    }
  });

  const readFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = readFileContent(file.name, event.target.result);
      originalData = data;
      displayOriginalData(originalData);
      populateColumnSelect(originalData);
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

  const displayOriginalData = (data) => {
    const originalDataTable = document.getElementById("originalDataTable");
    originalDataTable.innerHTML = generateTableHTML(data);
  };

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

  const populateColumnSelect = (data) => {
    const headers = Object.keys(data[0]);
    targetColumnSelect.innerHTML = '<option value="">Select Column</option>';
    headers.forEach((header) => {
      targetColumnSelect.innerHTML += `<option value="${header}">${header}</option>`;
    });
  };

  const cleanData = () => {
    let changesLog = [];
    cleanedData = _.cloneDeep(originalData);

    if (removeDuplicatesCheckbox.checked) {
      const initialLength = cleanedData.length;
      cleanedData = _.uniqWith(cleanedData, _.isEqual);
      const duplicatesRemoved = initialLength - cleanedData.length;
      changesLog.push(`Removed duplicates: ${duplicatesRemoved}`);
    }

    // Handle Missing Values
    if (handleMissingValuesCheckbox.checked) {
      let handledCount = 0;
      if (missingValuesMethodSelect.value === "remove-rows") {
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
      } else if (missingValuesMethodSelect.value === "remove-columns") {
        const columnsToRemove = [];
        const rowCount = cleanedData.length;

        Object.keys(cleanedData[0]).forEach((key) => {
          let emptyCount = 0;
          cleanedData.forEach((row) => {
            if (row[key] === null || row[key] === "") {
              emptyCount++;
            }
          });
          if (emptyCount === rowCount) {
            columnsToRemove.push(key);
          }
        });

        cleanedData = cleanedData.map((row) => {
          columnsToRemove.forEach((col) => delete row[col]);
          return row;
        });

        changesLog.push(
          `Handled missing values (removed columns): ${columnsToRemove.length}`
        );
      } else if (missingValuesMethodSelect.value === "fill-mean") {
        const columnMeans = {};

        Object.keys(cleanedData[0]).forEach((key) => {
          const values = cleanedData
            .map((row) => parseFloat(row[key]))
            .filter((value) => !isNaN(value));
          const mean =
            values.reduce((acc, value) => acc + value, 0) / values.length;
          columnMeans[key] = mean;
        });

        cleanedData = cleanedData.map((row) => {
          Object.keys(row).forEach((key) => {
            if (row[key] === null || row[key] === "") {
              row[key] = columnMeans[key];
              handledCount++;
            }
          });
          return row;
        });
        changesLog.push(
          `Handled missing values (filled with mean): ${handledCount}`
        );
      } else if (missingValuesMethodSelect.value === "fill-mode") {
        const columnModes = {};

        Object.keys(cleanedData[0]).forEach((key) => {
          const values = cleanedData
            .map((row) => row[key])
            .filter((value) => value !== null && value !== "");
          const mode = values.reduce((a, b, i, arr) =>
            arr.filter((v) => v === a).length >=
            arr.filter((v) => v === b).length
              ? a
              : b
          );
          columnModes[key] = mode;
        });

        cleanedData = cleanedData.map((row) => {
          Object.keys(row).forEach((key) => {
            if (row[key] === null || row[key] === "") {
              row[key] = columnModes[key];
              handledCount++;
            }
          });
          return row;
        });
        changesLog.push(
          `Handled missing values (filled with mode): ${handledCount}`
        );
      } else if (missingValuesMethodSelect.value === "fill-median") {
        const columnMedians = {};

        Object.keys(cleanedData[0]).forEach((key) => {
          const values = cleanedData
            .map((row) => parseFloat(row[key]))
            .filter((value) => !isNaN(value));
          const median = calculateMedian(values);
          columnMedians[key] = median;
        });

        cleanedData = cleanedData.map((row) => {
          Object.keys(row).forEach((key) => {
            if (row[key] === null || row[key] === "") {
              row[key] = columnMedians[key];
              handledCount++;
            }
          });
          return row;
        });
        changesLog.push(
          `Handled missing values (filled with median): ${handledCount}`
        );
      } else if (missingValuesMethodSelect.value === "fill-custom") {
        const customValue = customValueInput.value;

        cleanedData = cleanedData.map((row) => {
          Object.keys(row).forEach((key) => {
            if (row[key] === null || row[key] === "") {
              row[key] = customValue;
              handledCount++;
            }
          });
          return row;
        });
        changesLog.push(
          `Handled missing values (filled with custom value): ${handledCount}`
        );
      } else if (missingValuesMethodSelect.value === "forward-fill") {
        cleanedData.forEach((row, rowIndex) => {
          Object.keys(row).forEach((key) => {
            if ((row[key] === null || row[key] === "") && rowIndex > 0) {
              row[key] = cleanedData[rowIndex - 1][key];
              handledCount++;
            }
          });
        });
        changesLog.push(
          `Handled missing values (forward filled): ${handledCount}`
        );
      } else if (missingValuesMethodSelect.value === "backward-fill") {
        for (let rowIndex = cleanedData.length - 1; rowIndex >= 0; rowIndex--) {
          const row = cleanedData[rowIndex];
          Object.keys(row).forEach((key) => {
            if (
              (row[key] === null || row[key] === "") &&
              rowIndex < cleanedData.length - 1
            ) {
              row[key] = cleanedData[rowIndex + 1][key];
              handledCount++;
            }
          });
        }
        changesLog.push(
          `Handled missing values (backward filled): ${handledCount}`
        );
      }
    }

    if (correctDateFormatsCheckbox.checked) {
      let correctedCount = 0;
      const dateFormat = dateFormatSelect.value;
      cleanedData = cleanedData.map((row) => {
        Object.keys(row).forEach((key) => {
          if (Date.parse(row[key])) {
            row[key] = moment(row[key]).format(dateFormat);
            correctedCount++;
          }
        });
        return row;
      });
      changesLog.push(`Corrected date formats: ${correctedCount}`);
    }

    if (deleteOutliersCheckbox.checked) {
      const numericalColumns = Object.keys(cleanedData[0]).filter((key) =>
        cleanedData.every((row) => !isNaN(row[key]))
      );
      let outliersRemovedCount = 0;

      numericalColumns.forEach((column) => {
        const values = cleanedData.map((row) => parseFloat(row[column]));
        const q1 = quantile(values, 0.25);
        const q3 = quantile(values, 0.75);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const initialLength = cleanedData.length;
        cleanedData = cleanedData.filter(
          (row) =>
            parseFloat(row[column]) >= lowerBound &&
            parseFloat(row[column]) <= upperBound
        );
        outliersRemovedCount += initialLength - cleanedData.length;
      });

      changesLog.push(`Deleted outliers: ${outliersRemovedCount}`);
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
      let consistencyChangesCount = 0;
      const headers = Object.keys(originalData[0]);
      cleanedData = cleanedData.map((row) => {
        const newRow = {};
        headers.forEach((header) => {
          newRow[header] = row[header] || "";
        });
        if (Object.keys(newRow).length !== Object.keys(row).length) {
          consistencyChangesCount++;
        }
        return newRow;
      });
      changesLog.push(
        `Ensured structural consistency: ${consistencyChangesCount}`
      );
    }

    if (mergeDuplicateRowsCheckbox.checked) {
      const mergedData = [];
      const seenKeys = {};

      cleanedData.forEach((row) => {
        const key = JSON.stringify(row);
        if (seenKeys[key]) {
          Object.keys(row).forEach((col) => {
            if (!isNaN(row[col])) {
              seenKeys[key][col] += parseFloat(row[col]);
            }
          });
        } else {
          seenKeys[key] = { ...row };
        }
      });

      for (const key in seenKeys) {
        mergedData.push(seenKeys[key]);
      }

      cleanedData = mergedData;
      changesLog.push(`Merged duplicate rows`);
    }

    if (removeUnwantedSpacesCheckbox.checked) {
      const targetColumn = targetColumnSelect.value;
      let spacesRemovedCount = 0;

      cleanedData = cleanedData.map((row) => {
        if (row[targetColumn]) {
          const originalValue = row[targetColumn];
          row[targetColumn] = row[targetColumn].replace(/\s+/g, " ").trim();
          const spacesRemoved = originalValue.length - row[targetColumn].length;
          spacesRemovedCount += spacesRemoved > 0 ? 1 : 0;
        }
        return row;
      });

      changesLog.push(
        `Removed unwanted spaces from column: ${targetColumn} (Total cells cleaned: ${spacesRemovedCount})`
      );
    }

    displayCleanedData(cleanedData);
    logCleanedDataActions(changesLog);
  };

  const quantile = (arr, q) => {
    const sorted = arr.sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  };

  const calculateMedian = (arr) => {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const displayCleanedData = (data) => {
    const updatedDataTable = document.getElementById("updatedDataTable");
    updatedDataTable.innerHTML = generateTableHTML(data);
  };

  const logCleanedDataActions = (changesLog) => {
    const logContainer = document.getElementById("log");
    logContainer.innerHTML = "<h3>Data Cleaning Actions:</h3>";
    changesLog.forEach((log) => {
      logContainer.innerHTML += `<p>${log}</p>`;
    });
  };

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

  const clearData = () => {
    originalData = [];
    cleanedData = [];
    document.getElementById("originalDataTable").innerHTML = "";
    document.getElementById("updatedDataTable").innerHTML = "";
    document.getElementById("log").innerHTML = "";
    fileInput.value = "";
  };

  fileInput.addEventListener("change", (event) => {
    readFile(event.target.files[0]);
  });

  cleanDataButton.addEventListener("click", cleanData);
  exportDataButton.addEventListener("click", exportData);
  clearDataButton.addEventListener("click", clearData);
});
