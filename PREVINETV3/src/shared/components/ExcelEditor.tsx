import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import * as XLSX from "xlsx";

registerAllModules();

export type ExcelMergeCell = {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
};

export type ExcelTemplateData = {
  data: any[][];
  mergeCells?: ExcelMergeCell[];
  colWidths?: number[];
  rowHeights?: number[];
};

type Props = {
  data?: ExcelTemplateData;
  onChange?: (data: ExcelTemplateData) => void;
  readOnly?: boolean;
  height?: string | number;
  width?: string | number;
};

export default function ExcelEditor({ data, onChange, readOnly = false, height = 500, width = "100%" }: Props) {
  const hotRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const isUpdatingRef = useRef(false);
  const [tableKey, setTableKey] = useState(0);

  const initialData = useMemo(() => {
    return data?.data || Array(50).fill(null).map(() => Array(20).fill(""));
  }, [data]);

  const initialMergeCells = useMemo(() => data?.mergeCells || [], [data]);
  const initialColWidths = useMemo(() => data?.colWidths || Array(20).fill(100), [data]);
  const initialRowHeights = useMemo(() => data?.rowHeights, [data]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (data?.data) {
      isUpdatingRef.current = true;
      setTableKey((k) => k + 1);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 200);
    }
  }, [data]);

  const handleAfterChange = useCallback(
    (_changes: any, source: string) => {
      if (source === "loadData" || isUpdatingRef.current || !onChange || !hotRef.current?.hotInstance) return;

      const hot = hotRef.current.hotInstance;
      const currentData = hot.getData();
      const mergeCellsPlugin = hot.getPlugin("mergeCells");
      const mergedCells = mergeCellsPlugin?.mergedCellsCollection?.mergedCells || [];

      const formattedMerges: ExcelMergeCell[] = mergedCells.map((mc: any) => ({
        row: mc.row,
        col: mc.col,
        rowspan: mc.rowspan,
        colspan: mc.colspan,
      }));

      onChange({
        data: currentData,
        mergeCells: formattedMerges,
        colWidths: initialColWidths,
        rowHeights: initialRowHeights,
      });
    },
    [onChange, initialColWidths, initialRowHeights]
  );

  const handleAfterMergeCells = useCallback(() => {
    if (isUpdatingRef.current || !onChange || !hotRef.current?.hotInstance) return;

    const hot = hotRef.current.hotInstance;
    const currentData = hot.getData();
    const mergeCellsPlugin = hot.getPlugin("mergeCells");
    const mergedCells = mergeCellsPlugin?.mergedCellsCollection?.mergedCells || [];

    const formattedMerges: ExcelMergeCell[] = mergedCells.map((mc: any) => ({
      row: mc.row,
      col: mc.col,
      rowspan: mc.rowspan,
      colspan: mc.colspan,
    }));

    onChange({
      data: currentData,
      mergeCells: formattedMerges,
    });
  }, [onChange]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center bg-slate-50 border rounded-md" style={{ height, width }}>
        <span className="text-slate-500 text-sm">Cargando editor...</span>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden" style={{ width }}>
      <HotTable
        ref={hotRef}
        key={tableKey}
        data={initialData}
        rowHeaders={true}
        colHeaders={true}
        height={height}
        width="100%"
        licenseKey="non-commercial-and-evaluation"
        mergeCells={initialMergeCells}
        colWidths={initialColWidths}
        rowHeights={initialRowHeights}
        readOnly={readOnly}
        contextMenu={!readOnly ? [
          "row_above",
          "row_below",
          "---------",
          "col_left",
          "col_right",
          "---------",
          "remove_row",
          "remove_col",
          "---------",
          "mergeCells",
          "---------",
          "undo",
          "redo",
          "---------",
          "copy",
          "cut",
          "---------",
          "alignment",
        ] : false}
        manualColumnResize={!readOnly}
        manualRowResize={!readOnly}
        stretchH="all"
        autoWrapRow={true}
        autoWrapCol={true}
        afterChange={handleAfterChange}
        afterMergeCells={handleAfterMergeCells}
        afterUnmergeCells={handleAfterMergeCells}
      />
    </div>
  );
}

export async function importExcelFile(file: File): Promise<ExcelTemplateData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const numRows = Math.max(range.e.r + 1, 50);
  const numCols = Math.max(range.e.c + 1, 20);

  const data: any[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: any[] = [];
    for (let c = 0; c < numCols; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      row.push(cell ? (cell.w || cell.v || "") : "");
    }
    data.push(row);
  }

  const mergeCells: ExcelMergeCell[] = [];
  const merges = (worksheet as any)["!merges"] as Array<any> | undefined;
  if (merges) {
    for (const merge of merges) {
      mergeCells.push({
        row: merge.s.r,
        col: merge.s.c,
        rowspan: merge.e.r - merge.s.r + 1,
        colspan: merge.e.c - merge.s.c + 1,
      });
    }
  }

  const colWidths: number[] = [];
  const cols = (worksheet as any)["!cols"] as Array<any> | undefined;
  if (cols) {
    for (let c = 0; c < numCols; c++) {
      const colInfo = cols[c];
      colWidths.push(colInfo?.wpx || (colInfo?.wch ? colInfo.wch * 10 : 100));
    }
  } else {
    for (let c = 0; c < numCols; c++) colWidths.push(100);
  }

  const rowHeights: number[] = [];
  const rows = (worksheet as any)["!rows"] as Array<any> | undefined;
  if (rows) {
    for (let r = 0; r < numRows; r++) {
      const rowInfo = rows[r];
      rowHeights.push(rowInfo?.hpx || rowInfo?.hpt || 23);
    }
  }

  return {
    data,
    mergeCells,
    colWidths,
    rowHeights: rowHeights.length > 0 ? rowHeights : undefined,
  };
}

export function exportToExcel(templateData: ExcelTemplateData, fileName: string = "plantilla.xlsx") {
  const worksheet = XLSX.utils.aoa_to_sheet(templateData.data);

  if (templateData.mergeCells && templateData.mergeCells.length > 0) {
    (worksheet as any)["!merges"] = templateData.mergeCells.map((mc) => ({
      s: { r: mc.row, c: mc.col },
      e: { r: mc.row + mc.rowspan - 1, c: mc.col + mc.colspan - 1 },
    }));
  }

  if (templateData.colWidths) {
    (worksheet as any)["!cols"] = templateData.colWidths.map((w) => ({ wch: Math.round(w / 10) }));
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
  XLSX.writeFile(workbook, fileName);
}
