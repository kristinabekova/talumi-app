import { SIZE_META, type SudokuSize } from "./types";

type Props = {
  size: SudokuSize; puzzle: number[]; values: number[]; notes: number[][]; hints: boolean[];
  selected: number; conflicts: Set<number>; checkedWrong: Set<number>; onSelect: (index: number) => void;
};

export function SudokuCell({ index, ...props }: Props & { index: number }) {
  const { size, puzzle, values, notes, hints, selected, conflicts, checkedWrong, onSelect } = props;
  const { blockRows, blockCols } = SIZE_META[size];
  const row = Math.floor(index / size), col = index % size;
  const selectedRow = Math.floor(selected / size), selectedCol = selected % size;
  const sameBlock = Math.floor(row / blockRows) === Math.floor(selectedRow / blockRows) && Math.floor(col / blockCols) === Math.floor(selectedCol / blockCols);
  const related = row === selectedRow || col === selectedCol || sameBlock;
  const sameNumber = Boolean(values[index] && values[index] === values[selected]);
  const classes = ["sudoku-cell", puzzle[index] ? "given" : "editable", index === selected ? "selected" : "", related ? "related" : "", sameNumber ? "same-number" : "", conflicts.has(index) ? "conflict" : "", checkedWrong.has(index) ? "needs-look" : "", hints[index] ? "hinted" : ""].filter(Boolean).join(" ");
  const description = puzzle[index] ? `predvyplnené číslo ${values[index]}` : values[index] ? `hráčovo číslo ${values[index]}` : "prázdne políčko";
  const borderStyle = { borderRightWidth: (col + 1) % blockCols === 0 && col + 1 < size ? 3 : 1, borderBottomWidth: (row + 1) % blockRows === 0 && row + 1 < size ? 3 : 1 };
  return <button className={classes} style={borderStyle} onClick={() => onSelect(index)} tabIndex={index === selected ? 0 : -1} aria-label={`Riadok ${row + 1}, stĺpec ${col + 1}, ${description}${conflicts.has(index) ? ", konflikt" : ""}`} data-index={index}>
    {values[index] ? <strong>{values[index]}</strong> : notes[index]?.length ? <span className="cell-notes" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(size))},1fr)` }}>{Array.from({ length: size }, (_, n) => <i key={n}>{notes[index].includes(n + 1) ? n + 1 : ""}</i>)}</span> : null}
    {conflicts.has(index) && <span className="conflict-mark" aria-hidden="true">!</span>}
  </button>;
}

export function SudokuGrid(props: Props) {
  return <div className={`sudoku-grid size-${props.size}`} style={{ gridTemplateColumns: `repeat(${props.size},1fr)` }} role="grid" aria-label={`Sudoku ${props.size} krát ${props.size}`}>
    {props.values.map((_, index) => <SudokuCell key={index} index={index} {...props} />)}
  </div>;
}
