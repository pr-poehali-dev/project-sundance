import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

type Piece = {
  type: 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'
  color: 'w' | 'b'
}

type Board = (Piece | null)[][]
type Position = { row: number; col: number }

const PIECE_UNICODE: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}

function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null))
  const backRow: Piece['type'][] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  backRow.forEach((type, col) => {
    board[0][col] = { type, color: 'b' }
    board[7][col] = { type, color: 'w' }
  })
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'P', color: 'b' }
    board[6][col] = { type: 'P', color: 'w' }
  }
  return board
}

function isValidMove(board: Board, from: Position, to: Position, color: 'w' | 'b'): boolean {
  const piece = board[from.row][from.col]
  if (!piece || piece.color !== color) return false
  const target = board[to.row][to.col]
  if (target && target.color === color) return false

  const dr = to.row - from.row
  const dc = to.col - from.col

  const pathClear = (rStep: number, cStep: number, steps: number) => {
    for (let i = 1; i < steps; i++) {
      if (board[from.row + i * rStep][from.col + i * cStep]) return false
    }
    return true
  }

  switch (piece.type) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1
      const startRow = color === 'w' ? 6 : 1
      if (dc === 0 && dr === dir && !target) return true
      if (dc === 0 && dr === dir * 2 && from.row === startRow && !target && !board[from.row + dir][from.col]) return true
      if (Math.abs(dc) === 1 && dr === dir && target) return true
      return false
    }
    case 'R': {
      if (dr !== 0 && dc !== 0) return false
      const steps = Math.max(Math.abs(dr), Math.abs(dc))
      return pathClear(Math.sign(dr), Math.sign(dc), steps)
    }
    case 'N':
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2)
    case 'B': {
      if (Math.abs(dr) !== Math.abs(dc)) return false
      return pathClear(Math.sign(dr), Math.sign(dc), Math.abs(dr))
    }
    case 'Q': {
      if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false
      const steps = Math.max(Math.abs(dr), Math.abs(dc))
      return pathClear(Math.sign(dr), Math.sign(dc), steps)
    }
    case 'K':
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1
    default:
      return false
  }
}

function getValidMoves(board: Board, from: Position, color: 'w' | 'b'): Position[] {
  const moves: Position[] = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isValidMove(board, from, { row, col }, color)) {
        moves.push({ row, col })
      }
    }
  }
  return moves
}

function evaluateBoard(board: Board): number {
  const values: Record<string, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 }
  let score = 0
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = board[row][col]
      if (p) score += (p.color === 'b' ? 1 : -1) * values[p.type]
    }
  }
  return score
}

function applyMove(board: Board, from: Position, to: Position): Board {
  const newBoard = board.map(r => [...r])
  newBoard[to.row][to.col] = newBoard[from.row][from.col]
  newBoard[from.row][from.col] = null
  if (newBoard[to.row][to.col]?.type === 'P') {
    if (to.row === 0 && newBoard[to.row][to.col]?.color === 'w') newBoard[to.row][to.col] = { type: 'Q', color: 'w' }
    if (to.row === 7 && newBoard[to.row][to.col]?.color === 'b') newBoard[to.row][to.col] = { type: 'Q', color: 'b' }
  }
  return newBoard
}

function aiMove(board: Board): { from: Position; to: Position } | null {
  let bestScore = -Infinity
  let bestMove: { from: Position; to: Position } | null = null

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (!piece || piece.color !== 'b') continue
      const moves = getValidMoves(board, { row, col }, 'b')
      for (const move of moves) {
        const newBoard = applyMove(board, { row, col }, move)
        let score = evaluateBoard(newBoard)
        let counterBest = Infinity
        for (let r2 = 0; r2 < 8; r2++) {
          for (let c2 = 0; c2 < 8; c2++) {
            const p2 = newBoard[r2][c2]
            if (!p2 || p2.color !== 'w') continue
            const moves2 = getValidMoves(newBoard, { row: r2, col: c2 }, 'w')
            for (const m2 of moves2) {
              const nb2 = applyMove(newBoard, { row: r2, col: c2 }, m2)
              const s2 = evaluateBoard(nb2)
              if (s2 < counterBest) counterBest = s2
            }
          }
        }
        if (counterBest !== Infinity) score = counterBest
        if (score > bestScore) {
          bestScore = score
          bestMove = { from: { row, col }, to: move }
        }
      }
    }
  }
  return bestMove
}

export default function ChessGame() {
  const [board, setBoard] = useState<Board>(createInitialBoard)
  const [selected, setSelected] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [turn, setTurn] = useState<'w' | 'b'>('w')
  const [status, setStatus] = useState<string>('Ваш ход — играете белыми')
  const [gameOver, setGameOver] = useState(false)
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null)

  const checkGameOver = useCallback((b: Board, color: 'w' | 'b') => {
    let hasKing = false
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (b[r][c]?.type === 'K' && b[r][c]?.color === color) hasKing = true
    return !hasKing
  }, [])

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameOver || turn !== 'w') return

    const piece = board[row][col]

    if (selected) {
      const isValidTarget = validMoves.some(m => m.row === row && m.col === col)
      if (isValidTarget) {
        const newBoard = applyMove(board, selected, { row, col })
        setLastMove({ from: selected, to: { row, col } })
        setSelected(null)
        setValidMoves([])

        if (checkGameOver(newBoard, 'b')) {
          setBoard(newBoard)
          setStatus('Вы победили! 🎉')
          setGameOver(true)
          return
        }

        setBoard(newBoard)
        setTurn('b')
        setStatus('ИИ думает...')
        setTimeout(() => {
          const move = aiMove(newBoard)
          if (move) {
            const afterAi = applyMove(newBoard, move.from, move.to)
            setLastMove(move)
            setBoard(afterAi)
            if (checkGameOver(afterAi, 'w')) {
              setStatus('ИИ победил. Попробуйте ещё раз!')
              setGameOver(true)
            } else {
              setStatus('Ваш ход')
            }
          }
          setTurn('w')
        }, 400)
      } else if (piece && piece.color === 'w') {
        setSelected({ row, col })
        setValidMoves(getValidMoves(board, { row, col }, 'w'))
      } else {
        setSelected(null)
        setValidMoves([])
      }
    } else {
      if (piece && piece.color === 'w') {
        setSelected({ row, col })
        setValidMoves(getValidMoves(board, { row, col }, 'w'))
      }
    }
  }, [board, selected, validMoves, turn, gameOver, checkGameOver])

  const resetGame = () => {
    setBoard(createInitialBoard())
    setSelected(null)
    setValidMoves([])
    setTurn('w')
    setStatus('Ваш ход — играете белыми')
    setGameOver(false)
    setLastMove(null)
  }

  const isHighlighted = (row: number, col: number) => validMoves.some(m => m.row === row && m.col === col)
  const isSelected = (row: number, col: number) => selected?.row === row && selected?.col === col
  const isLastMove = (row: number, col: number) =>
    (lastMove?.from.row === row && lastMove?.from.col === col) ||
    (lastMove?.to.row === row && lastMove?.to.col === col)

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between w-full max-w-xs md:max-w-sm mb-1">
        <span className="text-sm text-neutral-400">{status}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetGame}
          className="text-neutral-400 hover:text-white h-7 px-2"
        >
          <Icon name="RotateCcw" size={14} />
          <span className="ml-1 text-xs">Заново</span>
        </Button>
      </div>

      <div className="border border-neutral-700 rounded-sm overflow-hidden shadow-2xl">
        {board.map((row, rIdx) => (
          <div key={rIdx} className="flex">
            {row.map((piece, cIdx) => {
              const isLight = (rIdx + cIdx) % 2 === 0
              const highlighted = isHighlighted(rIdx, cIdx)
              const sel = isSelected(rIdx, cIdx)
              const last = isLastMove(rIdx, cIdx)

              let bg = isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
              if (last) bg = isLight ? 'bg-[#cdd16f]' : 'bg-[#aaa23a]'
              if (sel) bg = 'bg-[#f6f669]'

              return (
                <div
                  key={cIdx}
                  className={`relative flex items-center justify-center cursor-pointer select-none
                    w-9 h-9 md:w-11 md:h-11 lg:w-13 lg:h-13 ${bg}
                    ${turn === 'w' && !gameOver ? 'hover:brightness-110' : ''}
                    transition-all`}
                  onClick={() => handleSquareClick(rIdx, cIdx)}
                >
                  {highlighted && (
                    <div className={`absolute rounded-full ${piece ? 'inset-0 border-[3px] border-black/30 rounded-none' : 'w-3 h-3 bg-black/25'}`} />
                  )}
                  {piece && (
                    <span className={`relative z-10 leading-none select-none
                      text-xl md:text-2xl lg:text-3xl
                      ${piece.color === 'w' ? 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]' : 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]'}`}
                    >
                      {PIECE_UNICODE[piece.color + piece.type]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-1 mt-1">
        {['a','b','c','d','e','f','g','h'].map(l => (
          <span key={l} className="text-[10px] text-neutral-600 w-9 md:w-11 text-center">{l}</span>
        ))}
      </div>
    </motion.div>
  )
}
