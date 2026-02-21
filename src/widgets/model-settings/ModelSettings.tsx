/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useSettingsStore, AVAILABLE_MODELS } from "@/shared/store/settingsStore";
import { theme } from "@/shared/ui/theme";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const Panel = styled.div`
  background: ${theme.colors.bgSecondary};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.lg};
  padding: 28px;
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
`;

const Title = styled.h2`
  margin: 0 0 20px;
  font-size: 18px;
  color: ${theme.colors.textPrimary};
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  margin-bottom: 6px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  background: ${theme.colors.bgTertiary};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.textPrimary};
  font-size: 14px;
  outline: none;
  margin-bottom: 20px;
  &:focus {
    border-color: ${theme.colors.accent};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background: ${theme.colors.bgTertiary};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.textPrimary};
  font-size: 13px;
  font-family: inherit;
  outline: none;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 20px;
  &:focus {
    border-color: ${theme.colors.accent};
  }
`;

const RangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const RangeInput = styled.input`
  flex: 1;
  accent-color: ${theme.colors.accent};
`;

const RangeValue = styled.span`
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  min-width: 32px;
  text-align: right;
`;

const BtnRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Btn = styled.button<{ variant?: "primary" | "ghost" }>`
  padding: 10px 20px;
  border-radius: ${theme.radius.md};
  font-size: 14px;
  cursor: pointer;
  border: none;
  ${(p) =>
    p.variant === "primary"
      ? `background: ${theme.colors.accent}; color: white; &:hover { background: ${theme.colors.accentHover}; }`
      : `background: ${theme.colors.bgTertiary}; color: ${theme.colors.textSecondary}; &:hover { background: ${theme.colors.border}; }`}
`;

interface ModelSettingsProps {
  onClose: () => void;
}

export function ModelSettings({ onClose }: ModelSettingsProps) {
  const { model, systemPrompt, temperature, setModel, setSystemPrompt, setTemperature } =
    useSettingsStore();

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Title>Settings</Title>

        <Label>Model</Label>
        <Select value={model} onChange={(e) => setModel(e.target.value)}>
          {AVAILABLE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>

        <Label>System Prompt</Label>
        <TextArea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="System prompt for the AI..."
        />

        <Label>Temperature: </Label>
        <RangeRow>
          <RangeInput
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
          <RangeValue>{temperature}</RangeValue>
        </RangeRow>

        <BtnRow>
          <Btn variant="ghost" onClick={onClose}>
            Close
          </Btn>
        </BtnRow>
      </Panel>
    </Overlay>
  );
}
