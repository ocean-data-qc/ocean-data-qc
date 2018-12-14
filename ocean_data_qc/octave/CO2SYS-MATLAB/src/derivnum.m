
% derivnum()
% This subroutine computes partial derivatives of output carbonate variables 
% with respect to input variables (two), plus nutrients (two), temperature and salinity,
% dissociation constants, and total boron.
%
% It uses central differences, introducing a small perturbation 
% (plus and minus of a delta) in one input variable and computes the
% resulting induced change in each output variable
%
% After numerical tests, the small PERTURBATION (delta) is chosen
% as a fraction of a reference value as follows:
% * 1.e-3 (0.1%) for the equilibrium constants and total boron 
% * 1.e-6        for the pair of CO2 system input variables (PAR1, PAR2)
% * 1.e-4        for temperature and salinity
% * 1.e-3        for total dissolved inorganic P and Si (PO4, SI)
%
%**************************************************************************
%
%  **** SYNTAX:
%  [deriv, headers_der, units_der, headers_err, units_err]=...
%                  derivnum(VARID,PAR1,PAR2,PAR1TYPE,PAR2TYPE,...
%                          SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,...
%                          SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS)
% 
%  **** SYNTAX EXAMPLES:
%  [der, headers, units] = derivnum('par1',2400,2200,1,2,35,0,25,4200,0,15,1,1,4,1)
%  [der, headers, units] = derivnum('sit', 2400,   8,1,3,35,0,25,4200,0,15,1,1,4,1)
%  [deriv, headers]      = derivnum(  'T',  500,   8,5,3,35,0,25,4200,0,15,1,1,4,1)
%  [deriv]               = derivnum('S',2400,2000:10:2400,1,2,35,0,25,4200,0,15,1,1,4,1)
%  [deriv]               = derivnum('K0',2400,2200,1,2,0:1:35,0,25,4200,0,15,1,1,4,1)
%  [deriv]               = derivnum('K1',2400,2200,1,2,35,0,25,0:100:4200,0,15,1,1,4,1)
%  
%**************************************************************************
%
% INPUT:
%
%   - VARID     :   character string to select the input variable for which
%                   derivatives will be taken with respect to. 
%                   This variable appears in denominator of each resulting derivative.
%                   = variable length, case insensitive, character code
%                     case 'par1'  :  Parameter 1 of the input pair (This is TAlk if PAR1TYPE is 1)
%                     case 'par2'  :  Parameter 2 of the input pair (This is TAlk if PAR2TYPE is 1)
%                     case 'sil', 'silt', 'tsil', 'silicate', or 'sit'     : Silicate concentration
%                     case 'phos', 'phost', 'tphos', 'phosphate', or 'pt'  : Phosphate concentration
%                     case 't', 'temp' or 'temperature'           : temperature
%                     case 's', 'sal', or 'salinity'              : salinity
%                     case 'K0','K1','K2','Kb','Kw','Kspa', 'Kspc': dissociation constants 
%                     case 'bor': total boron
%
%   - all others :  same list of input parameters as in CO2SYS() subroutine (scalar or vectors)
%
%**************************************************************************%
%
% OUTPUT: * an array containing the derivative of the following parameter (one row per sample):
%         *  a cell-array containing crudely formatted headers
%
%    POS  PARAMETER        UNIT
%
%    01 - TAlk                 (umol/kgSW)
%    02 - TCO2                 (umol/kgSW)
%    03 - [H+] input           (umol/kgSW)
%    04 - pCO2 input           (uatm)
%    05 - fCO2 input           (uatm)
%    06 - HCO3 input           (umol/kgSW)
%    07 - CO3 input            (umol/kgSW)
%    08 - CO2 input            (umol/kgSW)
%    09 - OmegaCa input        ()
%    10 - OmegaAr input        ()
%    11 - xCO2 input           (ppm)
%    12 - [H+] output          ()
%    13 - pCO2 output          (uatm)
%    14 - fCO2 output          (uatm)
%    15 - HCO3 output          (umol/kgSW)
%    16 - CO3 output           (umol/kgSW)
%    17 - CO2 output           (umol/kgSW)
%    18 - OmegaCa output       ()
%    19 - OmegaAr output       ()
%    20 - xCO2 output          (ppm)
%
% Remark : if all input pairs are of the same type, derivatives of input pairs are omitted
%
function [derivatives, headers, units, headers_err, units_err] = ...
        derivnum (VARID,PAR1,PAR2,PAR1TYPE,PAR2TYPE, SAL,TEMPIN, ...
                  TEMPOUT,PRESIN,PRESOUT,SI,PO4, ...
                  pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);

    % For computing derivative with respect to Ks, one has to call CO2sys with a perturbed K
    % Requested perturbation is passed through the following global variables
    global PertK    % Id of perturbed K
    global Perturb  % perturbation

    % Input conditioning
    % ------------------

    VARID = upper(VARID);
    % Determine lengths of input vectors
    veclengths=[length(PAR1) length(PAR2) length(PAR1TYPE)...
                length(PAR2TYPE) length(SAL) length(TEMPIN)...
                length(TEMPOUT) length(PRESIN) length(PRESOUT)...
                length(SI) length(PO4) length(pHSCALEIN)...
                length(K1K2CONSTANTS) length(KSO4CONSTANTS)];

    if length(unique(veclengths))>2
            disp(' '); disp('*** INPUT ERROR: Input vectors must all be of same length, or of length 1. ***'); disp(' '); return
    end

    % Make column vectors of all input vectors
    PAR1         =PAR1         (:);
    PAR2         =PAR2         (:);
    PAR1TYPE     =PAR1TYPE     (:);
    PAR2TYPE     =PAR2TYPE     (:);
    SAL          =SAL          (:);
    TEMPIN       =TEMPIN       (:);
    TEMPOUT      =TEMPOUT      (:);
    PRESIN       =PRESIN       (:);
    PRESOUT      =PRESOUT      (:);
    SI           =SI           (:);
    PO4          =PO4          (:);
    pHSCALEIN    =pHSCALEIN    (:);
    K1K2CONSTANTS=K1K2CONSTANTS(:);
    KSO4CONSTANTS=KSO4CONSTANTS(:);

    % Find the longest column vector:
    ntps = max(veclengths);

    % Populate column vectors
    PAR1(1:ntps,1)          = PAR1(:)          ;
    PAR2(1:ntps,1)          = PAR2(:)          ;
    PAR1TYPE(1:ntps,1)      = PAR1TYPE(:)      ;
    PAR2TYPE(1:ntps,1)      = PAR2TYPE(:)      ;
    SAL(1:ntps,1)           = SAL(:)           ;
    TEMPIN(1:ntps,1)        = TEMPIN(:)        ;
    TEMPOUT(1:ntps,1)       = TEMPOUT(:)       ;
    PRESIN(1:ntps,1)        = PRESIN(:)        ;
    PRESOUT(1:ntps,1)       = PRESOUT(:)       ;
    SI(1:ntps,1)            = SI(:)            ;
    PO4(1:ntps,1)           = PO4(:)           ;
    pHSCALEIN(1:ntps,1)     = pHSCALEIN(:)     ;
    K1K2CONSTANTS(1:ntps,1) = K1K2CONSTANTS(:) ;
    KSO4CONSTANTS(1:ntps,1) = KSO4CONSTANTS(:) ;

    % BASELINE:
    % --------
    
    carb = CO2SYS(PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    % Compute [H+] in µmol/KgSW
    if (ndims(carb) == 2)
        Hin = 10.^(-carb(:,3)) * 1.e6;
        Hout = 10.^(-carb(:,18)) * 1.e6;
        carb = horzcat(carb(:,1:2), Hin, carb(:,3:17), Hout, carb(:,18:end));
    else
        Hin = 10.^(-carb(3)) * 1.e6;
        Hout = 10.^(-carb(18)) * 1.e6;
        carb = horzcat(carb(1:2), Hin, carb(3:17), Hout, carb(18:end));
    end    

    % Compute two slightly different values for input
    % -----------------------------------------------

    % Default values : not perturbed
    % no change on PAR1 and PAR2
    PAR11 = PAR1; PAR12 = PAR1;
    PAR21 = PAR2; PAR22 = PAR2;
    % no change on Sil total and Phos total
    SI1 = SI; SI2 = SI;
    PO41  = PO4; PO42  = PO4;
    % no change on T and S
    TEMP1 = TEMPIN; TEMP2 = TEMPIN;
    SAL1 = SAL; SAL2 = SAL;

    % Create empty vector for abs_dx (absolute delta)
    abs_dx  = nan(ntps,1);
    
    % Flag for dissociation constant as perturbed variable 
    flag_dissoc_K = 0;   % False
    % names of 7 dissociation constants and variable for total boron 
    K_names = {'K0', 'K1', 'K2', 'KB', 'KW', 'KSPA', 'KSPC', 'BOR'};    

    % Units for derivatives and for errors
    units_at = {'umol';'umol';'nmol';'total scale';'uatm kg';'uatm kg';'umol';'umol';...
                 'umol';'kg';'kg';'ppm kg';...
                 'nmol';'uatm kg';'uatm kg';'umol';'umol';...
                 'umol';'kg';'kg';'ppm kg';
                };
 
    units_kg  = {'umol/kg';'umol/kg';'nmol/kg';'total scale';'uatm';'uatm';'umol/kg';'umol/kg';...
                 'umol/kg';' ';' ';'ppm';...
                 'nmol/kg';'uatm';'uatm';'umol/kg';'umol/kg';...
                 'umol/kg';' ';' ';'ppm';
                };

    units_k = units_kg;
 
    units_pco2 = units_kg;
    
    units_err = units_kg;
 
    switch VARID
        case K_names
            flag_dissoc_K = 1;
            % Approximate values for K0, K1, K2, Kb, Kspa and Kspc
            % They will be used to compute an absolute perturbation
            % value on these constants
            K = [0.034, 1.2e-06, 8.3e-10, 2.1e-09, 6.1e-14, 6.7e-07, ...
                 4.3e-07, 0.0004157];
            % Choose value of absolute perturbation
            [is_in_K_names, index] = ismember(VARID, K_names);
            perturbation = K(index) * 1.e-3;   % 0.1 percent of Kx value
            abs_dx = 2 * perturbation;
            denom_headers = VARID;
            denom_units = ' ';
            units = units_k;
            
        case {'PAR1', 'VAR1'}      % PAR1 (first variable of input pair) is perturbed
            % Define a relative delta
            delta = 1.e-6;
          
             switch PAR1TYPE(1)
                case 1
                  denom_headers = 'ALK';
                  denom_units = 'umol';
                  units = units_at;
                  PAR1ref = 2300.; % umol/kg (global surface average, Orr et al., 2017)
                case 2
                  denom_headers = 'DIC';
                  denom_units = 'umol';
                  units = units_at;
                  PAR1ref = 2000.; % umol/kg (global surface average, Orr et al., 2017)
                case 3
                  denom_headers = 'H';
                  denom_units = 'nmol';
                  units = units_at;
                  PAR1ref = 1.0e-8 ; % mol/kg (equivalent to pH=8.0)
                case 4
                  denom_headers = 'pCO2';
                  denom_units = 'uatm';
                  units = units_pco2;
                  PAR1ref = 400.;  % uatm
                case 5
                  denom_headers = 'fCO2';
                  denom_units = 'uatm';
                  units = units_pco2;
                  PAR1ref = 400.; % uatm
            end
      
           % cases where first input variable is pH
            F = (PAR1TYPE == 3);
            H(F) = 10.^(-PAR1(F)) ; % [H+] in mol/kg
            % Change slightly [H+]
            H1 = H(F) - PAR1ref*delta;
            H2 = H(F) + PAR1ref*delta;
            PAR11(F) = -log10(H1) ;
            PAR12(F) = -log10(H2) ;
            abs_dx(F) = (H2 - H1) * 1e9; % now in nmol/kg
           
            G = ~F;
            % Change slightly PAR1
            PAR11(G) = PAR1(G) - PAR1ref*delta;
            PAR12(G) = PAR1(G) + PAR1ref*delta;
            abs_dx(G) = PAR12(G) - PAR11(G);

      case {'PAR2', 'VAR2'}    % PAR2 (second variable of input pair) is perturbed
            % Define a relative delta
            delta = 1.e-6;
            switch PAR2TYPE(1)
                case 1
                  denom_headers = 'ALK';
                  denom_units = 'umol';
                  units = units_at;
                  PAR2ref = 2300.; % umol/kg (global surface average, Orr et al., 2017)
                case 2
                  denom_headers = 'DIC';
                  denom_units = 'umol';
                  units = units_at;
                  PAR2ref = 2000.; % umol/kg (global surface average, Orr et al., 2017)
                case 3
                  denom_headers = 'H';
                  denom_units = 'nmol';
                  units = units_at;
                  PAR2ref = 1.0e-8 ; % mol/kg (equivalent to pH=8.0)
                case 4
                  denom_headers = 'pCO2';
                  denom_units = 'uatm';
                  units = units_pco2;
                  PAR2ref = 400.; % uatm
               case 5
                  denom_headers = 'fCO2';
                  denom_units = 'uatm';
                  units = units_pco2;
                  PAR2ref = 400.; % uatm
           end
            
            
            % cases where second input variable is pH
            F = (PAR2TYPE == 3);
            H(F) = 10.^(-PAR2(F)) ; % H+ in mol/kg
            % Change slightly [H+]
            H1 = H(F) - PAR2ref*delta;
            H2 = H(F) + PAR2ref*delta;
            PAR21(F) = -log10(H1) ;
            PAR22(F) = -log10(H2) ;
            abs_dx(F) = (H2 - H1) * 1e9;

            G = ~F;
            % Change slightly PAR2
            PAR21(G) = PAR2(G) - PAR2ref*delta;
            PAR22(G) = PAR2(G) + PAR2ref*delta;
            abs_dx(G) = PAR22(G) - PAR21(G);

       case {'SIL', 'TSIL', 'SILT', 'SILICATE', 'SIT'}    % Sil total
            % Define a relative delta
            delta = 1.e-3;
            SIref = 7.5; % umol/kg (global surface average, Orr et al., 2017)
            % Change slightly temperature
            SI1 = SI - SIref*delta;
            SI2 = SI + SIref*delta;
            abs_dx = SI2 - SI1;
            denom_headers = 'Sit';
            denom_units = 'umol';
            units = units_at;
       case {'PHOS', 'TPHOS', 'PHOST', 'PHOSPHATE', 'PT'}    % Phos total
            % Define a relative delta
            delta = 1.e-3;
            PO4ref = 0.5; % umol/kg (global surface average, Orr et al., 2017)
            % Change slightly temperature
            PO41 = PO4 - PO4ref*delta;
            PO42 = PO4 + PO4ref*delta;
            abs_dx = PO42 - PO41;
            denom_headers = 'Pt';
            denom_units = 'umol';
            units = units_at;
        case {'T', 'TEMP', 'TEMPERATURE'}    % Temperature
            % Define a relative delta
            delta = 1.e-4;
            TEMPref = 18.; % global surface mean (C)
            % Change slightly temperature
            TEMP1 = TEMPIN - TEMPref*delta;
            TEMP2 = TEMPIN + TEMPref*delta;
            abs_dx = TEMP2 - TEMP1;
            denom_headers = 'T';
            denom_units = 'C';
            units = units_kg;
        case {'S', 'SAL', 'SALINITY'}    % Salinity
            % Define a relative delta
            delta = 1.e-4;
            SALref = 35.;
            % Change slightly temperature
            SAL1 = SAL - SALref*delta;
            SAL2 = SAL + SALref*delta;
            abs_dx = SAL2 - SAL1;
            denom_headers = 'S';
            denom_units = 'psu';
            units = units_kg;
    end
    
    % PERTURBATION:
    % -------------

    % Point 1: (one dissociation constant or PAR1, PAR2, T or S is somewhat smaller)
    % if perturbed variable is a dissociation constant
    if (flag_dissoc_K)
        PertK = upper(VARID);
        Perturb = -perturbation;
    end
    cdel1 = CO2SYS ( ...
        PAR11,PAR21,PAR1TYPE,PAR2TYPE,SAL1,TEMP1,TEMPOUT,PRESIN,PRESOUT,SI1,PO41,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    % Compute [H+]
    if (ndims(cdel1) == 2)
        Hin = 10.^(-cdel1(:,3))   * 1.e9; % to show H+ results in nmol/kg
        Hout = 10.^(-cdel1(:,18)) * 1.e9;
        cdel1 = horzcat(cdel1(:,1:2), Hin, cdel1(:,3:17), Hout, cdel1(:,18:end));
    else
        Hin = 10.^(-cdel1(3))     * 1.e9;
        Hout = 10.^(-cdel1(18))   * 1.e9;
        cdel1 = horzcat(cdel1(1:2), Hin, cdel1(3:17), Hout, cdel1(18:end));
    end

    % Point 2: (one dissociation constant or PAR1, PAR2, T or S is somewhat bigger)
    % if perturbed variable is a dissociation constant
    if (flag_dissoc_K)
        PertK = upper(VARID);
        Perturb = perturbation;
    end
    cdel2 = CO2SYS ( ...
        PAR12,PAR22,PAR1TYPE,PAR2TYPE,SAL2,TEMP2,TEMPOUT,PRESIN,PRESOUT,SI2,PO42,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
    % Compute [H+]
    if (ndims(cdel2) == 2)
        % Computed variable H+ (does not affect other computed
        % variables, i.e., it is the numerator of the derivative)
        Hin = 10.^(-cdel2(:,3))   * 1.e9; % to show H+ results in nmol/kg 
        Hout = 10.^(-cdel2(:,18)) * 1.e9;
        cdel2 = horzcat(cdel2(:,1:2), Hin, cdel2(:,3:17), Hout, cdel2(:,18:end));
    else
        Hin = 10.^(-cdel2(3))     * 1.e9;
        Hout = 10.^(-cdel2(18))   * 1.e9;
        cdel2 = horzcat(cdel2(1:2), Hin, cdel2(3:17), Hout, cdel2(18:end));
    end

    % if perturbed variable is a dissociation constant
    if (flag_dissoc_K)
        PertK = ''; %% Return to normal
    end
    
    % Drop unnecessary columns
    % Note: colums (04 - pHin) and (20 - pHout) drop    
    % Keep only the following columns
    %    01 - TAlk                 (umol/kgSW)
    %    02 - TCO2                 (umol/kgSW)
    %    03 - [H+] input           (nmol/kgSW)  lastly added
    %    05 - pCO2 input           (uatm)
    %    06 - fCO2 input           (uatm)
    %    07 - HCO3 input           (umol/kgSW)
    %    08 - CO3 input            (umol/kgSW)
    %    09 - CO2 input            (umol/kgSW)
    %    16 - OmegaCa input        ()
    %    17 - OmegaAr input        ()
    %    18 - xCO2 input           (ppm)
    %    19 - [H+] output          (nmol/kgSW)  lastly added
    %    21 - pCO2 output          (uatm)
    %    22 - fCO2 output          (uatm)
    %    23 - HCO3 output          (umol/kgSW)
    %    24 - CO3 output           (umol/kgSW)
    %    25 - CO2 output           (umol/kgSW)
    %    32 - OmegaCa output       ()
    %    33 - OmegaAr output       ()
    %    34 - xCO2 output          (ppm)
    keep = [1 2 3 5 6 7 8 9 16 17 18 19 21 22 23 24 25 32 33 34];
    
    % We will drop also some column headers
    headers = {'TAlk';'TCO2';'Hin';'pHin';'pCO2in';'fCO2in';'HCO3in';'CO3in';...
        'CO2in';'OmegaCAin';'OmegaARin';'xCO2in';...
        'Hout';'pCO2out';'fCO2out';'HCO3out';'CO3out';...
        'CO2out';'OmegaCAout';'OmegaARout';'xCO2out';
        };
    headers_err = headers;
    %units = {'umol';'umol';'nmol';'total scale';'uatm';'uatm';'umol';'umol';...
    %    'umol';' ';' ';'ppm';...
    %    'nmol';'uatm';'uatm';'umol';'umol';...
    %    'umol';' ';' ';'ppm';
    %    };
    % Initially, keep all headers except 'pHin'
    keep_head =  [1:3 5:21];

    % if all parameter PAR1 are of the same type
    if all(PAR1TYPE == PAR1TYPE(1))
        % Determine column number of PAR1
        if PAR1TYPE(1) <= 3 % TAlk, TCO2 or pH
            % By design of CO2sys, PARTYPE is equal to column number
            col_number = PAR1TYPE(1);
        else
            % Because there is an extra column: [H+]
            col_number = PAR1TYPE(1) + 1;
        end
        % Exclude input parameters PAR1
        A = (keep ~= col_number);
        keep = keep (A);
        A = (keep_head ~= col_number);
        keep_head = keep_head (A);
    end
    % if all parameter PAR2 are of the same type
    if all(PAR2TYPE == PAR2TYPE(1))
        % Determine column number of PAR1
        if PAR2TYPE(1) <= 3 % TAlk, TCO2 or pH
            % By design of CO2sys, PARTYPE is equal to column number
            col_number = PAR2TYPE(1);
        else
            % Because there is an extra column: [H+]
            col_number = PAR2TYPE(1) + 1;
        end
        % Exclude input parameters PAR2
        A = (keep ~= col_number);
        keep = keep (A);
        A = (keep_head ~= col_number);
        keep_head = keep_head (A);
    end
    cdel1 = cdel1(:,keep);
    cdel2 = cdel2(:,keep);
    
    headers = headers(keep_head);
    units = units(keep_head);
    
    headers_err = headers_err(keep_head);
    units_err = units_err(keep_head);
    
    % concatenate strings to give each header its proper form, a partial derivative
    headers = strcat('d', headers, '/', 'd', denom_headers);
    % concatenate in an analogous way for the units
    units   = strcat('(',units, '/', denom_units,')');
    
    % Centered difference
    dy = (cdel2 - cdel1);

    % Compute ratio dy/dx
    if (isscalar(abs_dx))
        derivatives = dy ./ abs_dx;
    else
        derivatives = bsxfun(@rdivide, dy, abs_dx);
    end


end
