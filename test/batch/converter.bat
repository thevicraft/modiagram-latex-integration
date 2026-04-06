@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   MO-Helper SVG Generator (Editor Mode)
echo ========================================

:: 1. Temporäre Eingabedatei erstellen
set "INPUT_FILE=mo_content.txt"
if not exist %INPUT_FILE% (
    echo %% Gib hier deinen Code ein (Inhalt und Umgebung) > %INPUT_FILE%
)

echo Öffne Editor... Bitte Code eingeben, speichern und Editor SCHLIESSEN.
:: Öffnet Notepad und wartet ( /wait )
start /wait notepad.exe %INPUT_FILE%

echo.
echo Verarbeite Eingabe...

:: 2. Die finale .tex Datei zusammenbauen
(
echo \documentclass[tikz]{standalone}
echo \usepackage{mohelper}
echo \begin{document}
type %INPUT_FILE%
echo \end{document}
) > temp_mo.tex

:: 3. Kompilieren zu DVI
echo Kompiliere zu DVI...
latex -interaction=nonstopmode temp_mo.tex > nul

if errorlevel 1 (
    echo.
    echo [FEHLER] LaTeX-Fehler! Pruefe deinen Code in der temp_mo.log
    pause
    exit /b
)

:: 4. Konvertieren zu SVG
echo Konvertiere zu SVG...
dvisvgm --no-fonts --precision=2 --scale=2 temp_mo.dvi

:: 5. Aufräumen (wir behalten die mo_content.txt fuer das naechste Mal)
del temp_mo.tex temp_mo.dvi temp_mo.log temp_mo.aux

echo.
echo FERTIG! temp_mo.svg wurde erstellt.
pause