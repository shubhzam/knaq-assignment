"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Alert } from "@/features/alerts/types";
import AlertRow from "./AlertRow";

interface Props {
  alerts: Alert[];
}

export default function AlertTable({ alerts }: Props) {
  // track which alert ids are checked - local state, doesn't need Redux
  const [selected, setSelected] = useState<number[]>([]);

  const handleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <TableContainer component={Paper} sx={{ bgcolor: "background.paper" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ "& th": { color: "text.secondary", fontSize: "0.7rem", letterSpacing: "0.1em", fontWeight: 700 } }}>
            <TableCell padding="checkbox" />
            <TableCell>SEV</TableCell>
            <TableCell>ALERT TYPE</TableCell>
            <TableCell>DEVICE</TableCell>
            <TableCell>TIME</TableCell>
            <TableCell>STATUS</TableCell>
            <TableCell>ACTION</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              selected={selected.includes(alert.id)}
              onSelect={handleSelect}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}