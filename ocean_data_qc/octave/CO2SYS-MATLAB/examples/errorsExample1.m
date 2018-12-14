% Test of num_deriv() with scalar input
function result = test_errors ()
    PAR1 = 2300;    % Alk
    PAR2 = 2000;    % DIC
    PAR1TYPE = 1;
    PAR2TYPE = 2;
    SAL = 35;
    TEMPIN = 18;
    TEMPOUT = 2; 
    PRESIN = 0;
    PRESOUT = PRESIN;
    SI = 60;
    PO4 = 2;
    pHSCALEIN = 1;   % total scale
    K1K2CONSTANTS = 10; % Lueker 2000
    KSO4CONSTANTS = 1;  % KSO4 of Dickson & TB of Uppstrom 1979

    ePAR1 = 2;    % Alk
    ePAR2 = 2;    % DIC
    eSAL = 0;
    eTEMP = 0;
    eSI = 4;
    ePO4 = 0.1;
 
    % With no errors on Ks nor uncertainty in total boron
    epK=0;
    eBt=0;

    % No correlation between PAR1 and PAR2
    r=0;
    result = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS)

    % With default errors on Ks
    epK = '';
    eBt = '';
    result = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS)

    % With default errors on Ks and some correlation between input pairs
    epK = '';
    eBt = 0.01;
    r=0.02;     
    result = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r, pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
end

