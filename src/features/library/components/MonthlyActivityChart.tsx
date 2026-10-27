"use client";

import { Box, Typography } from "@mui/material";
import { LocaleText } from "@/components/common/LocaleText";

export type MonthActivity = {
  month: string;
  count: number;
};

type MonthlyActivityChartProps = {
  data: MonthActivity[];
  maximumCount: number;
};

export function MonthlyActivityChart({
  data,
  maximumCount,
}: MonthlyActivityChartProps) {
  return (
    <Box
      aria-label="Monthly activity chart"
      role="img"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        alignItems: "end",
        gap: 2,
        height: 280,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      {data.map((item) => (
        <Box
          key={item.month}
          sx={{
            display: "flex",
            height: "100%",
            flexDirection: "column",
            justifyContent: "end",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: "min(56px, 75%)",
              height: `${
                item.count === 0 ? 2 : Math.max(8, (item.count / maximumCount) * 90)
              }%`,
              borderRadius: "8px 8px 0 0",
              bgcolor: "primary.main",
              opacity: 0.72,
              transition: "height 0.3s ease, opacity 0.2s ease",
              "&:hover": {
                opacity: 1,
              },
            }}
          />
          <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="caption">
            <LocaleText message={item.month} />
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {item.count}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
