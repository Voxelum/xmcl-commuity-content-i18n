# XMCL कम्युनिटी कंटेंट i18n प्रोजेक्ट

यह रिपॉजिटरी XMCL के लिए मॉड्स, रिसोर्स पैक्स और शेडर्स जैसी कम्युनिटी सामग्री के अंतर्राष्ट्रीयकरण (i18n) का समर्थन करती है।

[English README](./README.en.md) [Українська README](./README.uk.md) [Русский README](./README.ru.md) [Deutsches README](./README.de.md) [Polskie README](./README.pl.md) [日本語 README](./README.ja.md) [Version française](./README.fr.md) [Italiano README](./README.it.md) [Беларуская README](./README.be.md) [Қазақша README](./README.kk.md) [简体中文 README](./README.md)

## इस रिपॉजिटरी की आवश्यकता क्यों है?

चूंकि कई उपयोगकर्ता मूल अंग्रेजी नामों के बजाय स्थानीयकृत नाम देखना अधिक पसंद करते हैं। इस रिपॉजिटरी का उद्देश्य अधिक उपयोगकर्ताओं को XMCL का बेहतर उपयोग करने में सक्षम बनाना है।

## योगदान कैसे करें

हम अनुवाद प्रबंधित करने के लिए Git का उपयोग करते हैं। आप इस रिपॉजिटरी को फोर्क कर सकते हैं और अनुवाद का योगदान देने के लिए एक पुल अनुरोध (Pull Request) सबमिट कर सकते हैं।

### किसी मॉड/रिसोर्स पैक/शेडर के लिए अनुवाद कैसे जोड़ें?

अनुवाद डेटा क्रमशः `src/<locale>/mods.csv`, `src/<locale>/resourcepacks.csv`, `src/<locale>/shaderpacks.csv`, और `src/<locale>/modpacks.csv` में संग्रहीत होता है।

`<locale>` उस भाषा का कोड है जिसका आप अनुवाद करना चाहते हैं (उदाहरण के लिए, हिंदी के लिए `hi`)।

प्रत्येक पंक्ति का प्रारूप इस प्रकार है:

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

`name` स्थानीयकृत नाम है और `description` स्थानीयकृत विवरण है। ये दोनों XMCL में प्रदर्शित होंगे।
